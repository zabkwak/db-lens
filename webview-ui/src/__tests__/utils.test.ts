import { expect } from 'vitest';
import { classNames, pluralize } from '../utils';

describe('classNames', () => {
	it('should create combined class name', () => {
		expect(classNames('baf', 'lek')).toEqual('baf lek');
	});

	it('should ignore falsy values', () => {
		expect(classNames('baf', undefined, 'lek', null, '')).toEqual('baf lek');
	});
});

describe('pluralize', () => {
	it('should pluralize word for 1', () => {
		expect(pluralize(1, 'dog')).toEqual('1 dog');
	});

	it('should pluralize word for 2', () => {
		expect(pluralize(2, 'dog')).toEqual('2 dogs');
	});

	it('should pluralize word for 0', () => {
		expect(pluralize(0, 'dog')).toEqual('0 dogs');
	});
});
