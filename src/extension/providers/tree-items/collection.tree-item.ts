import * as vscode from 'vscode';
import BaseDriver from '../../../drivers/base';
import TreeItem from './tree-item';

export default class CollectionTreeItem extends TreeItem {
	private _driver: BaseDriver<unknown, unknown>;
	private _namespace: string;

	constructor(name: string, parent: TreeItem | null, driver: BaseDriver<unknown, unknown>, namespace: string) {
		super(name, parent, vscode.TreeItemCollapsibleState.Collapsed);
		this._driver = driver;
		this._namespace = namespace;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('folder');
	}

	public getDriver(): BaseDriver<unknown, unknown> {
		return this._driver;
	}

	public getNamespace(): string {
		return this._namespace;
	}
}
