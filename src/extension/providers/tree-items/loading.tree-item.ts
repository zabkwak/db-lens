import * as vscode from 'vscode';
import TreeItem from './tree-item';

export default class LoadingTreeItem extends TreeItem {
	constructor();
	constructor(text: string);
	constructor(text: string = 'Loading...') {
		super(text, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon('loading~spin');
	}
}
