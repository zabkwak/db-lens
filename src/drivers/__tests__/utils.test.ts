import { expect } from 'chai';
import BaseDriver from '../base';
import { isIndexesDriver, isSqlDriver, isViewsDriver, stripOuterParentheses } from '../utils';

describe('Drivers Utils', () => {
	describe('isViewsDriver', () => {
		it('should return true if driver has getViews method', () => {
			const driver = {
				getViews: () => [],
				getViewDefinition: () => '',
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
				getViewDefinition: () => '',
				getIndexes: () => [],
				explain: () => {},
				explainAnalyze: () => {},
			} as unknown as BaseDriver<any, any>;
			expect(isSqlDriver(driver)).to.be.true;
		});

		it('should return false if driver does not have getSql method', () => {
			const driver = {} as unknown as BaseDriver<any, any>;
			expect(isSqlDriver(driver)).to.be.false;
		});
	});

	describe('stripOuterParentheses', () => {
		it('should return null for null', () => {
			expect(stripOuterParentheses(null)).to.be.null;
		});

		it('should strip wrapping parentheses', () => {
			expect(stripOuterParentheses('(deleted_at IS NULL)')).to.equal('deleted_at IS NULL');
			expect(stripOuterParentheses('((a > 1))')).to.equal('a > 1');
		});

		it('should keep parentheses that do not wrap the whole expression', () => {
			expect(stripOuterParentheses('(a > 1) AND (b < 2)')).to.equal('(a > 1) AND (b < 2)');
		});

		it('should keep expressions without parentheses', () => {
			expect(stripOuterParentheses('email IS NOT NULL')).to.equal('email IS NOT NULL');
		});
	});
});
