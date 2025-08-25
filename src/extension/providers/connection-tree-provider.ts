import * as vscode from 'vscode';
import ConnectionManager from '../../connection/connection-manager';
import Logger from '../../logger';
import { showInfo } from '../utils';
import PropertiesDataManager from './data-managers/properties.data-manager';
import CollectionTreeItem from './tree-items/collection.tree-item';
import ConnectionTreeItem, { EConnectionContextValue } from './tree-items/connection.tree-item';
import DataTreeItem from './tree-items/data.tree-item';
import LoadingTreeItem from './tree-items/loading.tree-item';
import PropertiesTreeItem from './tree-items/properties.tree-item';
import TreeItem from './tree-items/tree-item';
import WarningTreeItem from './tree-items/warning.tree-item';

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
		return [];
	}

	public getConnectionChildren(element: ConnectionTreeItem<any, any>): TreeItem[] {
		const connection = element.getConnection();
		if (connection.failed()) {
			return [new WarningTreeItem(`Connection failed: ${connection.getName()}`)];
		}
		if (connection.isConnected()) {
			if (!connection.hasCollections()) {
				this._loadCollections(element);
				return [new LoadingTreeItem('Loading collections...')];
			}
			const collections = connection.getCollections();
			if (!collections.length) {
				return [new WarningTreeItem('No collections found')];
			}
			return collections.map((collection) => new CollectionTreeItem(collection, connection.getDriver()));
		}
		if (!connection.isConnected() && !connection.isConnecting()) {
			this.connect(element);
		}
		return [new LoadingTreeItem('Connecting...')];
	}

	public getCollectionChildren(element: CollectionTreeItem): TreeItem[] {
		return [
			// TODO different name for no-sql
			new PropertiesTreeItem('Columns', new PropertiesDataManager(element.label as string, element.getDriver())),
		];
	}

	public getPropertiesChildren(element: PropertiesTreeItem): TreeItem[] {
		const error = element.getError();
		if (error) {
			return [new WarningTreeItem(`Failed to load properties: ${error.message}`)];
		}
		const data = element.getData();
		if (data) {
			return data.map(
				({ name, type, isPrimaryKey }) =>
					new TreeItem(
						`${name} (${type})`,
						vscode.TreeItemCollapsibleState.None,
						isPrimaryKey ? 'key' : 'output',
					),
			);
		}
		if (!element.isLoading()) {
			this._loadData(element);
		}
		return [new LoadingTreeItem('Loading properties...')];
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

	private async _loadCollections(item: ConnectionTreeItem<any, any>): Promise<void> {
		const connection = item.getConnection();
		Logger.info('connection', `Loading collections for ${connection.getName()}`);
		try {
			await connection.loadCollections();
			Logger.info('connection', `Collections loaded for ${connection.getName()}`);
			this.refresh(item);
		} catch (error: any) {
			Logger.error('connection', `Failed to load collections for ${connection.getName()}`, { error });
			vscode.window.showErrorMessage(`Failed to load collections: ${error.message}`);
		}
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
}
