import { IViewDriver } from '../../../drivers/interfaces';
import BaseDataManager from './base.data-manager';

export default class ViewsDataManager extends BaseDataManager<string> {
	private _driver: IViewDriver;

	constructor(driver: IViewDriver) {
		super();
		this._driver = driver;
	}

	protected _loadData(): Promise<string[]> {
		return this._driver.getViews();
	}
}
