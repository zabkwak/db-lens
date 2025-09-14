import * as vscode from 'vscode';
import Connection from '../../../connection/connection';
import TreeItem from './tree-item';

export default class NamespaceTreeItem extends TreeItem {
	private _name: string;
	private _connection: Connection<any, any>;

	constructor(name: string, parent: TreeItem | null, connection: Connection<any, any>) {
		super(name, parent, vscode.TreeItemCollapsibleState.Collapsed);
		this.contextValue = 'namespace';
		this._name = name;
		this._connection = connection;
	}

	public getName(): string {
		return this._name;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('database');
	}

	public getConnection(): Connection<any, any> {
		return this._connection;
	}
}
