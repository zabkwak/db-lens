import * as vscode from 'vscode';
import Connection from '../../../connection/connection';
import BaseDriver from '../../../drivers/base';
import CollectionsDataManager from '../data-managers/collections.data-manager';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';
import TreeItem from './tree-item';

export default class CollectionsTreeItem extends DataTreeItem<string> {
	private _connection: Connection<any, any>;
	private _namespace: string;

	constructor(
		label: string,
		parent: TreeItem | null,
		connection: Connection<any, any>,
		dataManager: CollectionsDataManager,
		namespace: string,
	) {
		super(label, parent, dataManager);
		this._connection = connection;
		this._namespace = namespace;
	}

	public getConnection(): Connection<any, any> {
		return this._connection;
	}

	public getDriver(): BaseDriver<unknown, unknown> {
		return this._connection.getDriver();
	}

	public getNamespace(): string {
		return this._namespace;
	}

	protected _getConfigLabel(): string {
		return 'collections';
	}

	protected _describeDataItem(item: string): IDataTreeItemDescriptor {
		return {
			label: item,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			icon: 'folder',
		};
	}

	protected _getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('folder');
	}
}
