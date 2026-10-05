import * as vscode from 'vscode';
import { IViewsDriver } from '../../../drivers/interfaces';
import ViewsDataManager from '../data-managers/views.data-manager';
import DataTreeItem, { IDataTreeItemDescriptor } from './data.tree-item';

export default class ViewsTreeItem extends DataTreeItem<string> {
	public getNamespace(): string {
		const dataManager = this._getDataManager() as ViewsDataManager;
		return dataManager.getNamespace();
	}

	public getDriver(): IViewsDriver {
		const dataManager = this._getDataManager() as ViewsDataManager;
		return dataManager.getDriver();
	}

	protected _describeDataItem(item: string): IDataTreeItemDescriptor {
		const dataManager = this._getDataManager() as ViewsDataManager;
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
