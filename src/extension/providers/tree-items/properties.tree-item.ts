import * as vscode from 'vscode';
import { ICollectionPropertyDescription } from '../../../drivers/interfaces';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';

export default class PropertiesTreeItem extends DataTreeItem<ICollectionPropertyDescription> {
	protected _describeDataItem(item: ICollectionPropertyDescription): IDataTreeItemDescriptor {
		return {
			label: `${item.name} (${item.type})`,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			icon: item.isPrimaryKey ? 'key' : 'output',
		};
	}

	protected _getConfigLabel(): string {
		return 'properties';
	}

	protected _getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('symbol-property');
	}
}
