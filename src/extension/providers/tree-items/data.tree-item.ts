import * as vscode from 'vscode';
import BaseDataManager from '../data-managers/base.data-manager';
import TreeItem from './tree-item';

export default abstract class DataTreeItem<T> extends TreeItem {
	private _dataManager: BaseDataManager<T>;

	private _loading: boolean = false;

	private _error: Error | null = null;

	constructor(label: string, dataManager: BaseDataManager<T>) {
		super(label);
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

	public hasError(): boolean {
		return this._error !== null;
	}

	public hasData(): boolean {
		return this.getData() !== null;
	}

	public isLoading(): boolean {
		return this._loading;
	}

	public getError(): Error | null {
		return this._error;
	}

	public getData(): T[] | null {
		return this._dataManager.getData();
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		if (this._loading) {
			return new vscode.ThemeIcon('loading~spin');
		}
		return this._getIcon();
	}

	protected abstract _getIcon(): vscode.ThemeIcon | undefined;
}
