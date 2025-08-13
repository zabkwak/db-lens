import { expect } from 'chai';
import { sleep } from '../../utils/utils';
import Password from '../password';

describe('Password', () => {
	it('should create instance of password without expiration', () => {
		const password = new Password('test-password');
		expect(password.password).to.be.equal('test-password');
		expect(password.isExpired()).to.be.false;
	});

	it('should create instance of password with expiration', () => {
		const password = new Password('test-password', new Date(Date.now() + 10000));
		expect(password.password).to.be.equal('test-password');
		expect(password.isExpired()).to.be.false;
	});

	it('should create instance of password with expiration and test expiration after it is expired', async () => {
		const password = new Password('test-password', new Date(Date.now() + 500));
		expect(password.password).to.be.equal('test-password');
		await sleep(1000);
		expect(password.isExpired()).to.be.true;
	});
});
