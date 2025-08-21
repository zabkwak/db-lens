import * as vscode from 'vscode';
import TreeItem from './tree-item';

export default class WarningTreeItem extends TreeItem {
	constructor(label: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('warning');
	}
}
