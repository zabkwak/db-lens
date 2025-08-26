import BaseDriver from './base';
import { IViewDriver } from './interfaces';

export function hasDriverGetViews<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & IViewDriver {
	return 'getViews' in driver;
}
