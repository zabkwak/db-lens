import { IViewsDriver } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class ViewsDataManager extends BaseDataManager<string> {
	private _driver: IViewsDriver;

	constructor(driver: IViewsDriver) {
		super();
		this._driver = driver;
	}

	protected _loadData(): Promise<string[]> {
		return this._driver.getViews();
	}
}
