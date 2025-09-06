import * as vscode from 'vscode';
import BaseDriver from '../../../drivers/base';
import CollectionsDataManager from '../data-managers/collections.data-manager';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';
import TreeItem from './tree-item';

export default class CollectionsTreeItem extends DataTreeItem<string> {
	private _driver: BaseDriver<unknown, unknown>;

	constructor(
		label: string,
		parent: TreeItem | null,
		driver: BaseDriver<unknown, unknown>,
		dataManager: CollectionsDataManager,
	) {
		super(label, parent, dataManager);
		this._driver = driver;
	}

	public getDriver(): BaseDriver<unknown, unknown> {
		return this._driver;
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
