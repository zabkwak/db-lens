import { expect } from 'chai';
import childProcess from 'child_process';
import sinon from 'sinon';
import AWS from '../aws';

describe('AWS', () => {
	let execStub: sinon.SinonStub;

	beforeEach(() => {
		execStub = sinon.stub(childProcess, 'exec');
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should call the aws command without JSON parsing', async () => {
		execStub.callsFake((cmd, callback) => {
			callback(null, 'Some aws response', '');
		});
		const result = await new AWS()
			.command('someCommand')
			.function('someFunction')
			.region('us-east-1')
			.profile('default')
			.string();
		const [cmd] = execStub.firstCall.args;
		expect(cmd).to.be.equal('aws someCommand someFunction --region us-east-1 --profile default');
		expect(result).to.equal('Some aws response');
	});

	it('should call the aws command with JSON parsing', async () => {
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
		const result = await new AWS<{ Parameter: { Name: string; Value: string } }>()
			.command('ssm')
			.function('get-parameter')
			.region('us-east-1')
			.profile('default')
			.arg('name', 'some_parameter')
			.arg('with-decryption')
			.json();
		const [cmd] = execStub.firstCall.args;
		expect(cmd).to.be.equal(
			'aws ssm get-parameter --region us-east-1 --profile default --name some_parameter --with-decryption',
		);
		expect(result).to.deep.equal({
			Parameter: {
				Name: 'some_parameter',
				Type: 'SecureString',
				Value: 'some-encrypted-value',
				Version: 1,
				LastModifiedDate: '2024-07-22T14:59:54.091000+02:00',
				ARN: 'arn:aws:ssm:us-east-1:00000000:parameter/some_parameter',
				DataType: 'text',
			},
		});
	});
});
