import * as vscode from 'vscode';
import BaseDataManager from '../data-managers/base.data-manager';
import TreeItem from './tree-item';

export interface IDataTreeItemDescriptor {
	label: string;
	collapsibleState: vscode.TreeItemCollapsibleState;
	icon: string;
}

export interface IDataTreeItemConfig {
	loading: string;
	noData: string;
	error: string;
}

export default abstract class DataTreeItem<T> extends TreeItem {
	private _dataManager: BaseDataManager<T>;

	private _loading: boolean = false;

	private _error: Error | null = null;

	constructor(label: string, parent: TreeItem | null, dataManager: BaseDataManager<T>) {
		super(label, parent);
		this._dataManager = dataManager;
	}

	public async load(): Promise<void> {
		this._loading = true;
		this._error = null;
		try {
			await this._dataManager.load();
		} catch (error: any) {
			this._error = error instanceof Error ? error : new Error(error);
			throw error;
		} finally {
			this._loading = false;
		}
	}

	public isLoading(): boolean {
		return this._loading;
	}

	public getError(): Error | null {
		return this._error;
	}

	public getData(): IDataTreeItemDescriptor[] | null {
		const data = this._dataManager.getData();
		return data ? data.map((item) => this._describeDataItem(item)) : null;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		if (this._loading) {
			return new vscode.ThemeIcon('loading~spin');
		}
		return this._getIcon();
	}

	public getConfig(): IDataTreeItemConfig {
		const label = this._getConfigLabel();
		return {
			loading: `Loading ${label}...`,
			noData: `No ${label} found`,
			error: `Failed to load ${label}`,
		};
	}

	protected _getConfigLabel(): string {
		return 'data';
	}

	protected abstract _getIcon(): vscode.ThemeIcon | undefined;

	protected abstract _describeDataItem(item: T): IDataTreeItemDescriptor;
}
