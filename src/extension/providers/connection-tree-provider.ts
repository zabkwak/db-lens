import * as vscode from 'vscode';
import ConnectionManager from '../../connection/connection-manager';
import { hasDriverGetViews } from '../../drivers/utils';
import Logger from '../../logger';
import { showInfo } from '../utils';
import CollectionsDataManager from './data-managers/collections.data-manager';
import PropertiesDataManager from './data-managers/properties.data-manager';
import ViewsDataManager from './data-managers/views.data-manager';
import CollectionTreeItem from './tree-items/collection.tree-item';
import CollectionsTreeItem from './tree-items/collections.tree-item';
import ConnectionTreeItem, { EConnectionContextValue } from './tree-items/connection.tree-item';
import DataTreeItem, { IDataTreeItemDescriptor } from './tree-items/data.tree-item';
import LoadingTreeItem from './tree-items/loading.tree-item';
import PropertiesTreeItem from './tree-items/properties.tree-item';
import TreeItem from './tree-items/tree-item';
import ViewsTreeItem from './tree-items/views.tree-item';
import WarningTreeItem from './tree-items/warning.tree-item';

interface IDataTreeItemConfig {
	loading?: string;
	noData?: string;
	error?: string;
}

export default class ConnectionTreeProvider implements vscode.TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	public setItemContextValue(item: TreeItem, contextValue: string): void {
		item.setContextValue(contextValue);
		this.refresh(item);
	}

	public refresh(): void;
	public refresh(item: TreeItem): void;
	public refresh(item?: TreeItem): void {
		this._onDidChangeTreeData.fire(item);
	}

	public getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
	}

	public getChildren(element?: TreeItem): TreeItem[] {
		const connections = ConnectionManager.getConnections();
		if (!connections) {
			this._loadConnections();
			return [new LoadingTreeItem()];
		}
		if (!connections.length) {
			return [new WarningTreeItem('No connections found')];
		}
		if (!element) {
			return connections.map((connection) => new ConnectionTreeItem(connection));
		}
		if (element instanceof ConnectionTreeItem) {
			return this.getConnectionChildren(element);
		}
		if (element instanceof CollectionTreeItem) {
			return this.getCollectionChildren(element);
		}
		if (element instanceof PropertiesTreeItem) {
			return this.getPropertiesChildren(element);
		}
		if (element instanceof CollectionsTreeItem) {
			return this.getCollectionsChildren(element);
		}
		if (element instanceof ViewsTreeItem) {
			return this.getDataTreeItemChildren(element, 'views');
		}
		if (element instanceof DataTreeItem) {
			return this.getDataTreeItemChildren(element);
		}
		return [];
	}

	public getConnectionChildren(element: ConnectionTreeItem<any, any>): TreeItem[] {
		const connection = element.getConnection();
		if (connection.failed()) {
			return [new WarningTreeItem(`Connection failed: ${connection.getName()}`)];
		}
		if (connection.isConnected()) {
			const driver = connection.getDriver();
			// TODO wording for no-sql
			const children: TreeItem[] = [
				new CollectionsTreeItem('Tables', driver, new CollectionsDataManager(connection)),
			];
			if (hasDriverGetViews(driver)) {
				children.push(new ViewsTreeItem('Views', new ViewsDataManager(driver)));
			}
			return children;
		}
		if (!connection.isConnected() && !connection.isConnecting()) {
			this.connect(element);
		}
		return [new LoadingTreeItem('Connecting...')];
	}

	public getCollectionsChildren(element: CollectionsTreeItem): TreeItem[] {
		return this.getDataTreeItemChildren(
			element,
			{
				loading: 'Loading collections...',
				noData: 'No collections found',
				error: 'Failed to load collections',
			},
			(item) => new CollectionTreeItem(item.label, element.getDriver()),
		);
	}

	public getDataTreeItemChildren<T>(element: DataTreeItem<T>): TreeItem[];
	public getDataTreeItemChildren<T>(element: DataTreeItem<T>, config: IDataTreeItemConfig): TreeItem[];
	public getDataTreeItemChildren<T>(element: DataTreeItem<T>, label: string): TreeItem[];
	public getDataTreeItemChildren<T>(
		element: DataTreeItem<T>,
		config: IDataTreeItemConfig,
		mapper: (item: IDataTreeItemDescriptor) => TreeItem,
	): TreeItem[];
	public getDataTreeItemChildren<T>(
		element: DataTreeItem<T>,
		label: string,
		mapper: (item: IDataTreeItemDescriptor) => TreeItem,
	): TreeItem[];
	public getDataTreeItemChildren<T>(
		element: DataTreeItem<T>,
		config?: IDataTreeItemConfig | string,
		mapper?: (item: IDataTreeItemDescriptor) => TreeItem,
	): TreeItem[] {
		const c = this._constructDataTreeItemConfig(config);
		const error = element.getError();
		if (error) {
			return [new WarningTreeItem(`${c.error || 'Failed to load data'}: ${error.message}`)];
		}
		const data = element.getData();
		if (data) {
			if (!data.length) {
				return [new WarningTreeItem(c.noData || 'No data found')];
			}
			return data.map((item) => {
				if (mapper) {
					return mapper(item);
				}
				return new TreeItem(item.label, item.collapsibleState, item.icon);
			});
		}
		if (!element.isLoading()) {
			this._loadData(element);
		}
		return [new LoadingTreeItem(c.loading || 'Loading data...')];
	}

	public getCollectionChildren(element: CollectionTreeItem): TreeItem[] {
		return [
			// TODO different name for no-sql
			new PropertiesTreeItem('Columns', new PropertiesDataManager(element.label as string, element.getDriver())),
		];
	}

	public getPropertiesChildren(element: PropertiesTreeItem): TreeItem[] {
		return this.getDataTreeItemChildren(element, {
			loading: 'Loading properties...',
			noData: 'No properties found',
			error: 'Failed to load properties',
		});
	}

	public async connect(item: ConnectionTreeItem<any, any>): Promise<void> {
		const connection = item.getConnection();
		Logger.info('connection', `Connecting to ${connection.getName()}`);
		try {
			this.setItemContextValue(item, EConnectionContextValue.CONNECTING);
			await item.connect();
			this.setItemContextValue(item, EConnectionContextValue.CONNECTED);
			Logger.info('connection', `Connected to ${connection.getName()}`);
			showInfo(`Connected to ${connection.getName()}`);
		} catch (error: any) {
			connection.close(true);
			this.setItemContextValue(item, EConnectionContextValue.DEFAULT);
			Logger.error('connection', `Failed to connect to ${connection.getName()}`, { error });
			vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
		}
	}

	public async disconnect(item: ConnectionTreeItem<any, any>): Promise<void> {
		const connection = item.getConnection();
		Logger.info('connection', `Disconnecting from ${connection.getName()}`);
		try {
			await connection.close();
			this.setItemContextValue(item, EConnectionContextValue.DEFAULT);
			Logger.info('connection', `Disconnected from ${connection.getName()}`);
		} catch (error: any) {
			this.setItemContextValue(item, EConnectionContextValue.DEFAULT);
			Logger.error('connection', `Failed to disconnect from ${connection.getName()}`, { error });
			vscode.window.showErrorMessage(`Failed to disconnect: ${error.message}`);
		}
	}

	private async _loadConnections() {
		this.refresh();
		await ConnectionManager.load();
		this.refresh();
	}

	private async _loadData(item: DataTreeItem<unknown>): Promise<void> {
		if (item.isLoading()) {
			return;
		}
		Logger.info('data', `Loading data for ${item.label}`);
		try {
			const p = item.load();
			this.refresh(item);
			await p;
			Logger.info('data', `Data loaded for ${item.label}`);
			this.refresh(item);
		} catch (error: any) {
			Logger.error('data', `Failed to load data for ${item.label}`, { error });
			vscode.window.showErrorMessage(`Failed to load data: ${error.message}`);
		}
	}
	private _constructDataTreeItemConfig(label?: IDataTreeItemConfig | string): IDataTreeItemConfig {
		if (!label) {
			return {
				loading: 'Loading data...',
				noData: 'No data found',
				error: 'Failed to load data',
			};
		}
		if (typeof label === 'string') {
			return {
				loading: `Loading ${label}...`,
				noData: `No ${label} found`,
				error: `Failed to load ${label}`,
			};
		}
		return label;
	}
}
