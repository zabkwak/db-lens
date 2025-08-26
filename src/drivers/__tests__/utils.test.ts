import { expect } from 'chai';
import BaseDriver from '../base';
import { hasDriverGetViews } from '../utils';

describe('Drivers Utils', () => {
	describe('hasDriverGetViews', () => {
		it('should return true if driver has getViews method', () => {
			const driver = {
				getViews: () => [],
			} as unknown as BaseDriver<any, any>;
			expect(hasDriverGetViews(driver)).to.be.true;
		});

		it('should return false if driver does not have getViews method', () => {
			const driver = {} as unknown as BaseDriver<any, any>;
			expect(hasDriverGetViews(driver)).to.be.false;
		});
	});
});
