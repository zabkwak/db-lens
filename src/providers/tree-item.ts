import * as vscode from 'vscode';

export default class TreeItem extends vscode.TreeItem {
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
	) {
		super(label, collapsibleState);
		this.label = label;
		this.iconPath = this.getIcon();
	}

	public setContextValue(contextValue: string): void {
		this.contextValue = contextValue;
		this.iconPath = this.getIcon();
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return undefined;
	}
}
