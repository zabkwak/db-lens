import { IViewsDriver } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class ViewsDataManager extends BaseDataManager<string> {
	private _driver: IViewsDriver;
	private _namespace: string;

	constructor(driver: IViewsDriver, namespace: string) {
		super();
		this._driver = driver;
		this._namespace = namespace;
	}

	protected _loadData(): Promise<string[]> {
		return this._driver.getViews(this._namespace);
	}
}
