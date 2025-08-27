import * as vscode from 'vscode';
import { IIndexDescription } from '../../../drivers/interfaces';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';

export default class IndexesTreeItem extends DataTreeItem<IIndexDescription> {
	protected _describeDataItem(item: IIndexDescription): IDataTreeItemDescriptor {
		return {
			label: `${item.name} - ${item.kind} ${item.type} (${item.columns.join(', ')})`,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			icon: item.kind === 'PRIMARY KEY' ? 'key' : 'output',
		};
	}

	protected _getConfigLabel(): string {
		return 'indexes';
	}

	protected _getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('symbol-property');
	}
}
