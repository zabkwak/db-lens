import * as vscode from 'vscode';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';

export default class ViewsTreeItem extends DataTreeItem<string> {
	protected _describeDataItem(item: string): IDataTreeItemDescriptor {
		return {
			label: item,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			icon: 'preview',
		};
	}

	protected _getConfigLabel(): string {
		return 'views';
	}

	protected _getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('preview');
	}
}
