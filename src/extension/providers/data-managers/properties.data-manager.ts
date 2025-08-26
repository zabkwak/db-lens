import BaseDriver from '../../../drivers/base';
import { ICollectionPropertyDescription } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class PropertiesDataManager extends BaseDataManager<ICollectionPropertyDescription> {
	private _collectionName: string;

	private _driver: BaseDriver<unknown, unknown>;

	constructor(collectionName: string, driver: BaseDriver<unknown, unknown>) {
		super();
		this._collectionName = collectionName;
		this._driver = driver;
	}

	protected _loadData(): Promise<ICollectionPropertyDescription[]> {
		return this._driver.describeCollection(this._collectionName);
	}
}
