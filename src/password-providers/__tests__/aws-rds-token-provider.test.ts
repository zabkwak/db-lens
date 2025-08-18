import { expect } from 'chai';
import childProcess from 'child_process';
import sinon from 'sinon';
import AWSRDSTokenPasswordProvider from '../aws-rds-token-provider';
import Password from '../password';

describe('AWSRDSTokenPasswordProvider', () => {
	let execStub: sinon.SinonStub;

	beforeEach(() => {
		execStub = sinon.stub(childProcess, 'exec');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('.getConfig', () => {
		it('should return set configuration', () => {
			const provider = new AWSRDSTokenPasswordProvider({
				host: 'localhost',
				port: 6666,
				username: 'user',
				region: 'region',
				profile: 'profile',
			});
			expect(provider.getConfig()).to.deep.equal({
				host: 'localhost',
				port: 6666,
				username: 'user',
				region: 'region',
				profile: 'profile',
			});
		});
	});

	describe('.getPassword', () => {
		it('should return the password', async () => {
			execStub.callsFake((cmd, callback) => {
				callback(
					null,
					'localhost:6666/?Action=connect&DBUser=user&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIEXAMPLE%2Fregion%2Frds-db%2Faws4_request&X-Amz-Date=20210123T011543Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=SIGNATURE',
					'',
				);
			});
			const provider = new AWSRDSTokenPasswordProvider({
				host: 'localhost',
				port: 6666,
				username: 'user',
				region: 'region',
				profile: 'profile',
			});
			const password = await provider.getPassword();
			expect(password).to.be.an.instanceOf(Password);
			expect(password.password).to.equal(
				'localhost:6666/?Action=connect&DBUser=user&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIEXAMPLE%2Fregion%2Frds-db%2Faws4_request&X-Amz-Date=20210123T011543Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=SIGNATURE',
			);
			expect(password.isExpired()).to.be.false;
			// @ts-expect-error _expiresAt is private
			expect(password._expiresAt).to.be.an.instanceOf(Date);
		});
	});
});
