import { IIndexDescription, IIndexesDriver } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class IndexesDataManager extends BaseDataManager<IIndexDescription> {
	private _collectionName: string;

	private _driver: IIndexesDriver;

	constructor(collectionName: string, driver: IIndexesDriver) {
		super();
		this._collectionName = collectionName;
		this._driver = driver;
	}

	protected _loadData(): Promise<IIndexDescription[]> {
		return this._driver.getIndexes(this._collectionName);
	}
}
