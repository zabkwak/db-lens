import * as vscode from 'vscode';
import { IViewsDriver } from '../../../drivers/interfaces';
import TreeItem from './tree-item';
import { IContextValue } from './types';

export default class ViewTreeItem extends TreeItem implements IContextValue {
	public contextValue: string;

	private _driver: IViewsDriver;
	private _namespace: string;

	constructor(name: string, parent: TreeItem | null, driver: IViewsDriver, namespace: string) {
		super(name, parent, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'view';
		this._driver = driver;
		this._namespace = namespace;
		this.command = {
			title: 'Show View Definition',
			command: 'db-lens.showViewDefinition',
			arguments: [this],
		};
	}

	public getName(): string {
		return this.label as string;
	}

	public getDriver(): IViewsDriver {
		return this._driver;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('preview');
	}

	public getNamespace(): string {
		return this._namespace;
	}
}
