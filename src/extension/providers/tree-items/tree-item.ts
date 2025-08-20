import * as vscode from 'vscode';

export default class TreeItem extends vscode.TreeItem {
	private _icon: string | undefined;

	constructor(label: string);
	constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState);
	constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, icon: string);
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
		icon?: string,
	) {
		super(label, collapsibleState);
		this.label = label;
		this._icon = icon;
		this.iconPath = this.getIcon();
	}

	public setContextValue(contextValue: string): void {
		this.contextValue = contextValue;
		this.iconPath = this.getIcon();
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return this._icon ? new vscode.ThemeIcon(this._icon) : undefined;
	}
}
