import BaseDriver from './base';
import { IIndexesDriver, ISqlDriver, IViewsDriver } from './interfaces';

export function isViewsDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & IViewsDriver {
	return 'getViews' in driver && 'getViewDefinition' in driver;
}

export function isIndexesDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & IIndexesDriver {
	return 'getIndexes' in driver;
}

export function isExplainingDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & ISqlDriver {
	return 'explain' in driver && 'explainAnalyze' in driver;
}

export function isSqlDriver<T, U>(driver: BaseDriver<T, U>): driver is BaseDriver<T, U> & ISqlDriver {
	return isViewsDriver(driver) && isIndexesDriver(driver) && isExplainingDriver(driver);
}

/** Removes parentheses wrapping the whole expression, e.g. `(a > 1)` -> `a > 1`. Leaves `(a) AND (b)` untouched. */
export function stripOuterParentheses(expression: string | null): string | null {
	if (expression === null) {
		return null;
	}
	let result = expression.trim();
	while (result.startsWith('(') && result.endsWith(')')) {
		let depth = 0;
		let wrapsWhole = true;
		for (let i = 0; i < result.length - 1; i++) {
			if (result[i] === '(') {
				depth++;
			} else if (result[i] === ')') {
				depth--;
			}
			if (depth === 0) {
				wrapsWhole = false;
				break;
			}
		}
		if (!wrapsWhole) {
			break;
		}
		result = result.slice(1, -1).trim();
	}
	return result;
}
