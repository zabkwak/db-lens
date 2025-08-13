import { expect } from 'chai';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import * as vscode from 'vscode';
import Connection from '../connection';
import ConnectionManager from '../connection-manager';

describe('ConnectionManager', () => {
	let homeDirStub: sinon.SinonStub;
	let getConfigurationStub: sinon.SinonStub;
	let getStub: sinon.SinonStub;

	beforeEach(() => {
		homeDirStub = sinon.stub(os, 'homedir').returns('/home/user');
		getConfigurationStub = vscode.workspace.getConfiguration as sinon.SinonStub;
		getStub = sinon.stub().withArgs('baseDir').returns(undefined);
		getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
	});

	afterEach(() => {
		homeDirStub.restore();
		getConfigurationStub.reset();
		getStub.reset();
		console.log('tick');
	});

	describe('.getConfigDirectory', () => {
		it('should return the default config directory', () => {
			expect(ConnectionManager.getConfigDirectory()).to.be.equal('/home/user/.db-lens');
		});

		it('should return the custom config directory', () => {
			getStub.withArgs('baseDir').returns('/custom/dir');
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			expect(ConnectionManager.getConfigDirectory()).to.be.equal('/custom/dir/.db-lens');
		});
	});

	describe('.getConnectionsFilePath', () => {
		it('should return the config file path', () => {
			expect(ConnectionManager.getConnectionsFilePath()).to.be.equal('/home/user/.db-lens/connections.json');
		});
	});

	describe('.load', () => {
		it("should try to load the connections file from home dir if it it doesn't exist", async () => {
			getStub.withArgs('baseDir').returns(undefined);
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await ConnectionManager.load();
			expect(getStub.calledOnce).to.be.true;
			expect(getStub.calledWith('baseDir')).to.be.true;
			expect(ConnectionManager.getConnections()).to.be.deep.equal([]);
		});

		it('should load the connections', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await ConnectionManager.load();
			expect(getStub.calledOnce).to.be.true;
			expect(getStub.calledWith('baseDir')).to.be.true;
			expect(ConnectionManager.getConnections()).to.have.length(1);
			const [connection] = ConnectionManager.getConnections() as Connection<any, any>[];
			expect(connection.getName()).to.be.equal('Test Connection');
			expect(connection.getConnection()).to.deep.equal({
				db: {
					driver: 'postgres',
					credentials: {
						host: 'some.host',
						port: 5432,
						username: 'some.user',
						database: 'postgres',
						schema: 'public',
						sslRejectUnauthorized: false,
					},
				},
				passwordProvider: {
					type: 'aws-rds-token',
					config: {
						host: 'some.host',
						port: 5432,
						username: 'some.user',
						region: 'us-east-1',
						profile: 'some-profile',
					},
				},
				sshTunnelOptions: {
					host: 'bastion',
					port: 22,
					username: 'ec2-user',
					privateKey: '/path/to/private/key',
					passphrase: null,
					localPort: 5432,
					localHost: 'localhost',
					connectionTimeout: 10000,
				},
			});
		});
	});
});
