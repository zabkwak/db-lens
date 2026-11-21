import * as vscode from 'vscode';
import { IIndexDescription } from '../../../drivers/interfaces';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';

export default class IndexesTreeItem extends DataTreeItem<IIndexDescription> {
	protected _describeDataItem(item: IIndexDescription): IDataTreeItemDescriptor {
		const includedColumns =
			item.includedColumns.length > 0 ? ` INCLUDE (${item.includedColumns.join(', ')})` : '';
		const condition = item.condition ? ` WHERE ${item.condition}` : '';
		const columns = `(${item.columns.join(', ')})${includedColumns}${condition}`;
		return {
			label: `${item.name} - ${item.kind} ${item.type} ${columns}`,
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
