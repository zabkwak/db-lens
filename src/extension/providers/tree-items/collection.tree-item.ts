import * as vscode from 'vscode';
import TreeItem from '../tree-item';

export default class CollectionTreeItem extends TreeItem {
	constructor(name: string) {
		super(name, vscode.TreeItemCollapsibleState.Collapsed);
	}
}
