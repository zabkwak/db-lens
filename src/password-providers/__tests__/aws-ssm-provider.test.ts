import { expect } from 'chai';
import childProcess from 'child_process';
import sinon from 'sinon';
import AWSSSMPasswordProvider from '../aws-ssm-provider';
import Password from '../password';

describe('AWSSSMPasswordProvider', () => {
	let execStub: sinon.SinonStub;

	beforeEach(() => {
		execStub = sinon.stub(childProcess, 'exec');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('.getConfig', () => {
		it('should return set configuration', () => {
			const provider = new AWSSSMPasswordProvider({
				name: 'some_parameter',
				region: 'region',
				profile: 'profile',
			});
			expect(provider.getConfig()).to.deep.equal({
				name: 'some_parameter',
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
					`{
    "Parameter": {
        "Name": "some_parameter",
        "Type": "SecureString",
        "Value": "some-encrypted-value",
        "Version": 1,
        "LastModifiedDate": "2024-07-22T14:59:54.091000+02:00",
        "ARN": "arn:aws:ssm:us-east-1:00000000:parameter/some_parameter",
        "DataType": "text"
    }
}`,
					'',
				);
			});
			const provider = new AWSSSMPasswordProvider({
				name: 'some_parameter',
				region: 'region',
				profile: 'profile',
			});
			const password = await provider.getPassword();
			expect(password).to.be.an.instanceOf(Password);
			expect(password.password).to.equal('some-encrypted-value');
			expect(password.isExpired()).to.be.false;
			// @ts-expect-error _expiresAt is private
			expect(password._expiresAt).to.be.null;
		});
	});
});
