import * as vscode from 'vscode';
import Connection from '../../../connection/connection';
import BaseDriver from '../../../drivers/base';
import TreeItem from './tree-item';
import { IContextValue } from './types';

export default class CollectionTreeItem extends TreeItem implements IContextValue {
	public contextValue: string;
	private _connection: Connection<any, any>;
	private _namespace: string;

	constructor(name: string, parent: TreeItem | null, connection: Connection<any, any>, namespace: string) {
		super(name, parent, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'collection';
		this._connection = connection;
		this._namespace = namespace;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('folder');
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
}
