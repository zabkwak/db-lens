import { expect } from 'chai';
import fs from 'fs/promises';
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
	let writeFileStub: sinon.SinonStub;

	beforeEach(() => {
		homeDirStub = sinon.stub(os, 'homedir').returns('/home/user');
		getConfigurationStub = vscode.workspace.getConfiguration as sinon.SinonStub;
		getStub = sinon.stub().withArgs('baseDir').returns(undefined);
		getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
		writeFileStub = sinon.stub(fs, 'writeFile').resolves();
	});

	afterEach(() => {
		ConnectionManager.clear();
		homeDirStub.restore();
		getConfigurationStub.reset();
		getStub.reset();
		writeFileStub.restore();
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

	describe('.addConnection', () => {
		it('should add the connection', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await ConnectionManager.addConnection(
				await Connection.create('Another connection', {
					db: {
						driver: 'postgres',
						credentials: {
							host: 'another.host',
							port: 3306,
							username: 'another.user',
							database: 'mysql',
							schema: 'public',
							sslRejectUnauthorized: false,
						},
					},
					passwordProvider: {
						type: 'aws-rds-token',
						config: {
							host: 'another.host',
							port: 3306,
							username: 'another.user',
							region: 'us-west-2',
							profile: 'another-profile',
						},
					},
					sshTunnelOptions: {
						host: 'bastion',
						port: 22,
						username: 'ec2-user',
						privateKey: '/path/to/private/key',
						passphrase: null,
						localPort: 3306,
						localHost: 'localhost',
						connectionTimeout: 10000,
					},
				}),
			);
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [connection, newConnection] = ConnectionManager.getConnections() as Connection<any, any>[];
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
			expect(newConnection.getName()).to.be.equal('Another connection');
			expect(newConnection.getConnection()).to.deep.equal({
				db: {
					driver: 'postgres',
					credentials: {
						host: 'another.host',
						port: 3306,
						username: 'another.user',
						database: 'mysql',
						schema: 'public',
						sslRejectUnauthorized: false,
					},
				},
				passwordProvider: {
					type: 'aws-rds-token',
					config: {
						host: 'another.host',
						port: 3306,
						username: 'another.user',
						region: 'us-west-2',
						profile: 'another-profile',
					},
				},
				sshTunnelOptions: {
					host: 'bastion',
					port: 22,
					username: 'ec2-user',
					privateKey: '/path/to/private/key',
					passphrase: null,
					localPort: 3306,
					localHost: 'localhost',
					connectionTimeout: 10000,
				},
			});
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			// TODO think of better testing of this
			expect(fileContent).to.be.equal(
				JSON.stringify(
					{
						'Test Connection': connection.getConnection(),
						'Another connection': newConnection.getConnection(),
					},
					null,
					4,
				),
			);
			expect(encoding).to.equal('utf-8');
		});

		it('should throw an error if connection with name already exists', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await expect(
				ConnectionManager.addConnection(
					await Connection.create('Test Connection', {
						db: {
							driver: 'postgres',
							credentials: {
								host: 'another.host',
								port: 3306,
								username: 'another.user',
								database: 'mysql',
								schema: 'public',
								sslRejectUnauthorized: false,
							},
						},
						passwordProvider: {
							type: 'aws-rds-token',
							config: {
								host: 'another.host',
								port: 3306,
								username: 'another.user',
								region: 'us-west-2',
								profile: 'another-profile',
							},
						},
						sshTunnelOptions: {
							host: 'bastion',
							port: 22,
							username: 'ec2-user',
							privateKey: '/path/to/private/key',
							passphrase: null,
							localPort: 3306,
							localHost: 'localhost',
							connectionTimeout: 10000,
						},
					}),
				),
			).to.be.rejectedWith(Error, 'Connection with name Test Connection already exists');
		});
	});

	describe('.deleteConnection', () => {
		it('should delete the existing connection', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = await Connection.create('Test Connection', {
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
			await ConnectionManager.deleteConnection(connection);
			expect(ConnectionManager.getConnections()).to.have.length(0);
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal('{}');
			expect(encoding).to.equal('utf-8');
		});
	});
});
