import * as vscode from 'vscode';
import ConnectionManager from '../../connection/connection-manager';
import { isIndexesDriver, isViewsDriver } from '../../drivers/utils';
import Logger from '../../logger';
import { showError, showInfo } from '../utils';
import CollectionsDataManager from './data-managers/collections.data-manager';
import IndexesDataManager from './data-managers/indexes.data-manager';
import PropertiesDataManager from './data-managers/properties.data-manager';
import ViewsDataManager from './data-managers/views.data-manager';
import CollectionTreeItem from './tree-items/collection.tree-item';
import CollectionsTreeItem from './tree-items/collections.tree-item';
import ConnectionTreeItem, { EConnectionContextValue } from './tree-items/connection.tree-item';
import DataTreeItem, { IDataTreeItemDescriptor } from './tree-items/data.tree-item';
import IndexesTreeItem from './tree-items/indexes.tree-item';
import PropertiesTreeItem from './tree-items/properties.tree-item';
import TreeItem from './tree-items/tree-item';
import ViewsTreeItem from './tree-items/views.tree-item';

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
			return [TreeItem.loading()];
		}
		if (!connections.length) {
			return [TreeItem.warning('No connections found')];
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
		if (element instanceof CollectionsTreeItem) {
			return this.getCollectionsChildren(element);
		}
		if (element instanceof DataTreeItem) {
			return this.getDataTreeItemChildren(element);
		}
		return [];
	}

	public getConnectionChildren(element: ConnectionTreeItem<any, any>): TreeItem[] {
		const connection = element.getConnection();
		if (connection.failed()) {
			return [TreeItem.warning(`Connection failed: ${connection.getName()}`)];
		}
		if (connection.isConnected()) {
			const driver = connection.getDriver();
			// TODO wording for no-sql
			const children: TreeItem[] = [
				new CollectionsTreeItem('Tables', driver, new CollectionsDataManager(connection)),
			];
			if (isViewsDriver(driver)) {
				children.push(new ViewsTreeItem('Views', new ViewsDataManager(driver)));
			}
			return children;
		}
		if (!connection.isConnected() && !connection.isConnecting()) {
			this.connect(element);
		}
		return [TreeItem.loading('Connecting...')];
	}

	public getCollectionsChildren(element: CollectionsTreeItem): TreeItem[] {
		return this.getDataTreeItemChildren(element, (item) => new CollectionTreeItem(item.label, element.getDriver()));
	}

	public getDataTreeItemChildren<T>(element: DataTreeItem<T>): TreeItem[];
	public getDataTreeItemChildren<T>(
		element: DataTreeItem<T>,
		mapper: (item: IDataTreeItemDescriptor) => TreeItem,
	): TreeItem[];
	public getDataTreeItemChildren<T>(
		element: DataTreeItem<T>,
		mapper?: (item: IDataTreeItemDescriptor) => TreeItem,
	): TreeItem[] {
		const c = element.getConfig();
		const error = element.getError();
		if (error) {
			return [TreeItem.warning(`${c.error}: ${error.message}`)];
		}
		const data = element.getData();
		if (data) {
			if (!data.length) {
				return [TreeItem.warning(c.noData)];
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
		return [TreeItem.loading(c.loading)];
	}

	public getCollectionChildren(element: CollectionTreeItem): TreeItem[] {
		const driver = element.getDriver();
		const children: TreeItem[] = [
			// TODO different name for no-sql
			new PropertiesTreeItem('Columns', new PropertiesDataManager(element.label as string, driver)),
		];
		if (isIndexesDriver(driver)) {
			children.push(new IndexesTreeItem('Indexes', new IndexesDataManager(element.label as string, driver)));
		}
		return children;
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
			showError(`Failed to connect: ${error.message}`);
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
			showError(`Failed to disconnect: ${error.message}`);
		}
	}

	private async _loadConnections() {
		// TODO handle errors
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
			showError(`Failed to load data: ${error.message}`);
			this.refresh(item);
		}
	}
}
