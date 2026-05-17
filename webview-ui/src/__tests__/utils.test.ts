import { expect } from 'vitest';
import { classNames, durationToString, pluralize } from '../utils';

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

describe('durationToString', () => {
	it('should format milliseconds', () => {
		expect(durationToString(500)).toEqual('500ms');
	});

	it('should format seconds', () => {
		expect(durationToString(1500)).toEqual('1.5000s');
	});

	it('should format minutes', () => {
		expect(durationToString(90000)).toEqual('1m 30s');
	});

	it('should format hours', () => {
		expect(durationToString(3661000)).toEqual('1h 01m 01s');
	});
});
