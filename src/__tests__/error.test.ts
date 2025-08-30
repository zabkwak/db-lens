import { expect } from 'chai';
import BaseError from '../error';

describe('BaseError', () => {
	describe('constructor', () => {
		it('should create error', () => {
			const error = new BaseError('Test error');
			expect(error).to.be.instanceOf(Error);
			expect(error.message).to.be.equal('Test error');
			expect(error).to.have.property('code', 'ERR_UNKNOWN');
		});

		it('should create error with custom code', () => {
			const error = new BaseError('Test error', 'ERR_CUSTOM');
			expect(error).to.be.instanceOf(Error);
			expect(error.message).to.be.equal('Test error');
			expect(error).to.have.property('code', 'ERR_CUSTOM');
		});
	});

	describe('.toJSON', () => {
		it('should return JSON representation of the error', () => {
			const error = new BaseError('Test error', 'ERR_CUSTOM');
			expect(error.toJSON()).to.deep.equal({
				message: 'Test error',
				code: 'ERR_CUSTOM',
			});
		});
	});

	describe('.toString', () => {
		it('should return string representation of the error', () => {
			const error = new BaseError('Test error', 'ERR_CUSTOM');
			expect(error.toString()).to.be.equal('[ERR_CUSTOM] Test error');
		});
	});
});
