import BaseDriver from '../../../drivers/base';
import { ICollectionPropertyDescription } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class PropertiesDataManager extends BaseDataManager<ICollectionPropertyDescription> {
	private _driver: BaseDriver<unknown, unknown>;
	private _namespace: string;
	private _collectionName: string;

	constructor(driver: BaseDriver<unknown, unknown>, namespace: string, collectionName: string) {
		super();
		this._driver = driver;
		this._namespace = namespace;
		this._collectionName = collectionName;
	}

	protected _loadData(): Promise<ICollectionPropertyDescription[]> {
		return this._driver.describeCollection(this._namespace, this._collectionName);
	}
}
