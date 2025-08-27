import BaseDriver from './base';
import { IIndexesDriver, ISqlDriver, IViewsDriver } from './interfaces';

export function isViewsDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & IViewsDriver {
	return 'getViews' in driver;
}

export function isIndexesDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & IIndexesDriver {
	return 'getIndexes' in driver;
}

export function isSqlDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & ISqlDriver {
	return isViewsDriver(driver) && isIndexesDriver(driver);
}
