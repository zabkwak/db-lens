import { expect } from 'chai';
import BaseDriver from '../base';
import { isIndexesDriver, isSqlDriver, isViewsDriver } from '../utils';

describe('Drivers Utils', () => {
	describe('isViewsDriver', () => {
		it('should return true if driver has getViews method', () => {
			const driver = {
				getViews: () => [],
			} as unknown as BaseDriver<any, any>;
			expect(isViewsDriver(driver)).to.be.true;
		});

		it('should return false if driver does not have getViews method', () => {
			const driver = {} as unknown as BaseDriver<any, any>;
			expect(isViewsDriver(driver)).to.be.false;
		});
	});

	describe('isIndexesDriver', () => {
		it('should return true if driver has getIndexes method', () => {
			const driver = {
				getIndexes: () => [],
			} as unknown as BaseDriver<any, any>;
			expect(isIndexesDriver(driver)).to.be.true;
		});

		it('should return false if driver does not have getIndexes method', () => {
			const driver = {} as unknown as BaseDriver<any, any>;
			expect(isIndexesDriver(driver)).to.be.false;
		});
	});

	describe('isSqlDriver', () => {
		it('should return true if driver has getSql method', () => {
			const driver = {
				getViews: () => [],
				getIndexes: () => [],
			} as unknown as BaseDriver<any, any>;
			expect(isSqlDriver(driver)).to.be.true;
		});

		it('should return false if driver does not have getSql method', () => {
			const driver = {} as unknown as BaseDriver<any, any>;
			expect(isSqlDriver(driver)).to.be.false;
		});
	});
});
