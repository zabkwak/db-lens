import { IIndexDescription, IIndexesDriver } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class IndexesDataManager extends BaseDataManager<IIndexDescription> {
	private _namespace: string;
	private _collectionName: string;

	private _driver: IIndexesDriver;

	constructor(namespace: string, collectionName: string, driver: IIndexesDriver) {
		super();
		this._namespace = namespace;
		this._collectionName = collectionName;
		this._driver = driver;
	}

	protected _loadData(): Promise<IIndexDescription[]> {
		return this._driver.getIndexes(this._namespace, this._collectionName);
	}
}
