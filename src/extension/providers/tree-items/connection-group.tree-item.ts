import * as vscode from 'vscode';
import ConnectionGroup from '../../../connection/connection-group';
import TreeItem from './tree-item';

export default class ConnectionGroupTreeItem extends TreeItem {
	private _group: ConnectionGroup;

	constructor(group: ConnectionGroup, parent: TreeItem | null) {
		super(group.getName(), parent, vscode.TreeItemCollapsibleState.Expanded);
		this._group = group;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('layers');
	}

	public getGroup(): ConnectionGroup {
		return this._group;
	}
}
