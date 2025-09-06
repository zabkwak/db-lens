import * as vscode from 'vscode';

export default class TreeItem extends vscode.TreeItem {
	public static loading(): TreeItem;
	public static loading(label: string): TreeItem;
	public static loading(label: string = 'Loading...'): TreeItem {
		return new TreeItem(label, null, vscode.TreeItemCollapsibleState.None, 'loading~spin');
	}

	public static warning(label: string): TreeItem {
		return new TreeItem(label, null, vscode.TreeItemCollapsibleState.None, 'warning');
	}

	private _icon: string | undefined;
	private _parent: TreeItem | null;

	constructor(label: string, parent: TreeItem | null);
	constructor(label: string, parent: TreeItem | null, collapsibleState: vscode.TreeItemCollapsibleState);
	constructor(
		label: string,
		parent: TreeItem | null,
		collapsibleState: vscode.TreeItemCollapsibleState,
		icon: string,
	);
	constructor(
		label: string,
		parent: TreeItem | null,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
		icon?: string,
	) {
		super(label, collapsibleState);
		this.label = label;
		this._parent = parent;
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

	public getParent(): TreeItem | null {
		return this._parent;
	}
}
