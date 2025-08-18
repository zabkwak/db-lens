import { expect } from 'chai';
import ConfigPasswordProvider from '../config-provider';
import Password from '../password';

describe('ConfigPasswordProvider', () => {
	describe('.getConfig', () => {
		it('should return set configuration', () => {
			const provider = new ConfigPasswordProvider({ password: 'test' });
			expect(provider.getConfig()).to.deep.equal({ password: 'test' });
		});
	});

	describe('.getPassword', () => {
		it('should return the password', async () => {
			const provider = new ConfigPasswordProvider({ password: 'test' });
			const password = await provider.getPassword();
			expect(password).to.be.an.instanceOf(Password);
			expect(password.password).to.equal('test');
			expect(password.isExpired()).to.be.false;
			// @ts-expect-error _expiresAt is private
			expect(password._expiresAt).to.be.null;
		});
	});
});
