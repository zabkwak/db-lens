import { expect } from 'chai';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import * as vscode from 'vscode';
import Connection from '../connection';
import ConnectionGroup from '../connection-group';
import ConnectionManager from '../connection-manager';
import {
	connection1,
	group1,
	nestedConnection1,
	newConnection1,
	updatedConnection1,
	updatedNestedConnection1,
} from './fixtures/connections';

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
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [connection, group] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(connection.getName()).to.be.equal('Test Connection');
			expect(connection.toJSON()).to.deep.equal({
				name: 'Test Connection',
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
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal({
				name: 'Group',
				connections: [
					{
						name: 'Nested connection',
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
					},
				],
			});
		});
	});

	describe('.addConnection', () => {
		it('should add the connection', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await ConnectionManager.addConnection(new Connection(newConnection1));
			expect(ConnectionManager.getConnections()).to.have.length(3);
			const [connection, group, newConnection] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(connection.getName()).to.be.equal('Test Connection');
			expect(connection.toJSON()).to.deep.equal(connection1);
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal(group1);
			expect(newConnection.getName()).to.be.equal('Another connection');
			expect(newConnection.toJSON()).to.deep.equal(newConnection1);
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			// TODO think of better testing of this
			expect(fileContent).to.be.equal(JSON.stringify([connection, group, newConnection], null, 4));
			expect(encoding).to.equal('utf-8');
		});

		it('should throw an error if connection with name already exists', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await expect(ConnectionManager.addConnection(new Connection(connection1))).to.be.rejectedWith(
				Error,
				'Connection with name Test Connection already exists',
			);
		});

		it('should add the connection to the group', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const newConnection = new Connection(newConnection1);
			await ConnectionManager.addConnection(newConnection, ['Group']);
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [connection, group] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(connection.getName()).to.be.equal('Test Connection');
			expect(connection.toJSON()).to.deep.equal(connection1);
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal({
				...group1,
				connections: [...group1.connections, newConnection1],
			});
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal(
				JSON.stringify(
					[
						connection,
						{
							...group1,
							connections: [...group1.connections, newConnection1],
						},
					],
					null,
					4,
				),
			);
			expect(encoding).to.equal('utf-8');
		});

		it('should throw an error if connection with name already exists in the group', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			await expect(
				ConnectionManager.addConnection(new Connection(nestedConnection1), ['Group']),
			).to.be.rejectedWith(Error, 'Child with name Nested connection already exists in group Group');
		});

		// TODO creating new group?
	});

	describe('.updateConnection', () => {
		it('should update existing connection', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection(updatedConnection1);
			await ConnectionManager.updateConnection(connection);
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [updatedConnection, group] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(updatedConnection.getName()).to.be.equal('Test Connection');
			expect(updatedConnection.toJSON()).to.deep.equal(updatedConnection1);
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal(group1);
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal(JSON.stringify([connection, group], null, 4));
			expect(encoding).to.equal('utf-8');
		});

		it("should throw an error if the connection doesn't exist", async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection({
				name: 'Non Existent Connection',
				db: {
					driver: 'postgres',
					credentials: {
						host: 'some.host',
						port: 5432,
						username: 'some.user',
						database: 'postgres',
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
			await expect(ConnectionManager.updateConnection(connection)).to.be.rejectedWith(
				Error,
				'Connection with name Non Existent Connection does not exist',
			);
		});

		it('should update existing connection in the group', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection(updatedNestedConnection1);
			await ConnectionManager.updateConnection(connection, ['Group']);
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [existingConnection, group] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(existingConnection.getName()).to.be.equal('Test Connection');
			expect(existingConnection.toJSON()).to.deep.equal(connection1);
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal({
				...group1,
				connections: [updatedNestedConnection1],
			});
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal(
				JSON.stringify(
					[
						connection1,
						{
							...group1,
							connections: [updatedNestedConnection1],
						},
					],
					null,
					4,
				),
			);
			expect(encoding).to.equal('utf-8');
		});

		it("should throw an error if the connection doesn't exist in the group", async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection({
				name: 'Non Existent Connection',
				db: {
					driver: 'postgres',
					credentials: {
						host: 'some.host',
						port: 5432,
						username: 'some.user',
						database: 'postgres',
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
			await expect(ConnectionManager.updateConnection(connection, ['Group'])).to.be.rejectedWith(
				Error,
				'Child with name Non Existent Connection not found in group Group',
			);
		});
	});

	describe('.deleteConnection', () => {
		it('should delete the existing connection', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection({
				name: 'Test Connection',
				db: {
					driver: 'postgres',
					credentials: {
						host: 'some.host',
						port: 5432,
						username: 'some.user',
						database: 'postgres',
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
			expect(ConnectionManager.getConnections()).to.have.length(1);
			const [group] = ConnectionManager.getConnections() as (Connection<any, any> | ConnectionGroup)[];
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal({
				name: 'Group',
				connections: [
					{
						name: 'Nested connection',
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
					},
				],
			});
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal(JSON.stringify([group], null, 4));
			expect(encoding).to.equal('utf-8');
		});

		it('should delete the existing connection from a group', async () => {
			getStub.withArgs('baseDir').returns(path.join(__dirname, './fixtures'));
			getConfigurationStub.withArgs('db-lens').returns({ get: getStub });
			const connection = new Connection(nestedConnection1);
			await ConnectionManager.deleteConnection(connection, ['Group']);
			expect(ConnectionManager.getConnections()).to.have.length(2);
			const [existingConnection, group] = ConnectionManager.getConnections() as (
				| Connection<any, any>
				| ConnectionGroup
			)[];
			expect(existingConnection.getName()).to.be.equal('Test Connection');
			expect(existingConnection.toJSON()).to.deep.equal(connection1);
			expect(group.getName()).to.be.equal('Group');
			expect(group.toJSON()).to.deep.equal({
				name: 'Group',
				connections: [],
			});
			expect(writeFileStub.calledOnce).to.be.true;
			const [filePath, fileContent, encoding] = writeFileStub.firstCall.args;
			expect(filePath).to.equal(path.join(__dirname, './fixtures/.db-lens/connections.json'));
			expect(fileContent).to.be.equal(JSON.stringify([existingConnection, group], null, 4));
			expect(encoding).to.equal('utf-8');
		});
	});
});
