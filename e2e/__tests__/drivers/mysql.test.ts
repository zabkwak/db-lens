import { expect } from 'chai';
import path from 'path';
import SSHTunnel from '../../../src/connection/ssh-tunnel';
import MySqlDriver from '../../../src/drivers/mysql';
import ConfigPasswordProvider from '../../../src/password-providers/config-provider';
import Password from '../../../src/password-providers/password';
import { cleanup, mysqlQuery, waitForMysqlReady } from '../utils';

interface IUser {
	id: string;
	username: string;
	email: string;
	created_timestamp: string;
}

describe('MySQL Driver', () => {
	before(async () => {
		await waitForMysqlReady();
	}).timeout(15000);

	afterEach(async () => {
		await mysqlQuery('TRUNCATE TABLE commands');
		await cleanup();
	});

	describe('.connect', () => {
		it('should throw an error for wrong port', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3307,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await expect(mysql.connect()).to.be.rejectedWith('ECONNREFUSED');
		});

		it('should throw an error for wrong password', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'testaaa',
				}),
			);
			await expect(mysql.connect()).to.be.rejectedWith(
				// "Access denied for user 'db-lens'@'172.19.0.1' (using password: YES)",
				'Access denied for user',
			);
		});

		it('should connect to the database', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await mysql.connect();
			expect(mysql.isConnected()).to.be.true;
			// @ts-expect-error
			expect(mysql._password).to.be.an.instanceOf(Password);
			await mysql.close();
		});

		it('should throw an error that ssh tunnel is not open', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
				new SSHTunnel({
					host: 'localhost',
					port: 2222,
					username: 'testuser',
					privateKey: path.resolve(__dirname, '../ssh_key'),
					passphrase: null,
					localPort: 1111,
					localHost: 'localhost',
					remotePort: 3306,
					remoteHost: 'mysql',
					strictHostChecking: false,
					userKnownHostsFile: '/dev/null',
				}),
			);
			await expect(mysql.connect()).to.be.rejectedWith('SSH tunnel is not open');
			expect(mysql.isConnected()).to.be.false;
		});

		// TODO this acting weirdly on mac now
		it.skip('should connect to the database using ssh tunnel', async () => {
			const tunnel = new SSHTunnel({
				host: 'localhost',
				port: 2222,
				username: 'testuser',
				privateKey: path.resolve(__dirname, '../../ssh_key'),
				passphrase: null,
				localPort: 1111,
				localHost: 'localhost',
				remotePort: 3306,
				remoteHost: 'mysql',
				strictHostChecking: false,
				userKnownHostsFile: '/dev/null',
			});
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
				tunnel,
			);
			await tunnel.open();
			await mysql.connect();
			expect(mysql.isConnected()).to.be.true;
			// @ts-expect-error
			expect(mysql._password).to.be.an.instanceOf(Password);
			await mysql.close();
			await tunnel.close();
		});
	});

	describe('.reconnect', () => {
		it('should throw an error if database is not connected', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await expect(mysql.reconnect()).to.be.rejectedWith('Database not connected');
		});

		it('should reconnect the database', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await mysql.connect();
			expect(mysql.isConnected()).to.be.true;
			await mysql.reconnect();
			expect(mysql.isConnected()).to.be.true;
		});
	});

	describe('.close', () => {
		it('should close the database connection', async () => {
			const postgres = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'db_lens',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await postgres.connect();
			expect(postgres.isConnected()).to.be.true;
			await postgres.close();
			expect(postgres.isConnected()).to.be.false;
			// @ts-expect-error
			expect(postgres._pool).to.be.null;
			// @ts-expect-error
			expect(postgres._password).to.be.null;
		});
	});

	describe('Data methods', () => {
		const mysql = new MySqlDriver(
			{
				host: 'localhost',
				port: 3306,
				username: 'db-lens',
				database: 'db_lens',
				disableSsl: true,
			},
			new ConfigPasswordProvider({
				password: 'test',
			}),
		);

		beforeEach(async () => {
			await mysql.connect();
		});

		afterEach(async () => {
			await mysql.close();
		});

		describe('.getCollections', () => {
			it('should return list of collections', async () => {
				const collections = await mysql.getCollections();
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal(['commands', 'users']);
			});
		});

		describe('.describeCollection', () => {
			it('should describe table', async () => {
				const properties = await mysql.describeCollection('users');
				expect(properties).to.be.an('array');
				expect(properties).to.deep.equal([
					{
						name: 'id',
						type: 'varchar(10)',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: true,
					},
					{
						name: 'username',
						type: 'varchar(50)',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: false,
					},
					{
						name: 'email',
						type: 'varchar(255)',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: false,
					},
					{
						name: 'created_timestamp',
						type: 'timestamp',
						isNullable: false,
						defaultValue: 'CURRENT_TIMESTAMP',
						isPrimaryKey: false,
					},
				]);
			});
		});

		describe('.getViews', () => {
			afterEach(async () => {
				await mysqlQuery('DROP VIEW IF EXISTS test_view');
			});

			it('should return list of views', async () => {
				await mysqlQuery('CREATE VIEW test_view AS SELECT * FROM users');
				const collections = await mysql.getViews();
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal(['test_view']);
			});

			it('should return empty list of views', async () => {
				const collections = await mysql.getViews();
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal([]);
			});
		});

		describe('.getIndexes', () => {
			afterEach(async () => {
				try {
					await mysqlQuery('DROP INDEX username_email ON users');
				} catch (e) {}
			});

			it('should return list of indexes for users table', async () => {
				const indexes = await mysql.getIndexes('users');
				expect(indexes).to.be.an('array');
				expect(indexes).to.deep.equal([
					{
						name: 'PRIMARY',
						kind: 'PRIMARY KEY',
						type: 'BTREE',
						columns: ['id'],
					},
					{
						name: 'username',
						kind: 'UNIQUE',
						type: 'BTREE',
						columns: ['username'],
					},
					{
						name: 'email',
						kind: 'UNIQUE',
						type: 'BTREE',
						columns: ['email'],
					},
				]);
			});

			it('should return list of indexes with combined index added', async () => {
				await mysqlQuery('CREATE INDEX username_email ON users (username, email)');
				const indexes = await mysql.getIndexes('users');
				expect(indexes).to.be.an('array');
				expect(indexes).to.deep.equal([
					{
						name: 'PRIMARY',
						kind: 'PRIMARY KEY',
						type: 'BTREE',
						columns: ['id'],
					},
					{
						name: 'username',
						kind: 'UNIQUE',
						type: 'BTREE',
						columns: ['username'],
					},
					{
						name: 'email',
						kind: 'UNIQUE',
						type: 'BTREE',
						columns: ['email'],
					},
					{
						name: 'username_email',
						kind: 'INDEX',
						type: 'BTREE',
						columns: ['username', 'email'],
					},
				]);
			});
		});

		describe('.query', () => {
			it('should throw a not connected error', async () => {
				await mysql.close();
				await expect(mysql.query<IUser>('select * from users')).to.be.rejectedWith('Database not connected');
			});

			it('should return all users', async () => {
				const result = await mysql.query<IUser>('select * from users');
				await result.commit();
				expect(result).to.have.all.keys('data', 'properties', 'command', 'rowCount', 'commit', 'rollback');
				expect(result.rollback).to.be.a('function');
				expect(result.commit).to.be.a('function');
				expect(result.command).to.be.equal('select');
				expect(result.rowCount).to.be.equal(5);
				expect(result.properties).to.be.an('array');
				expect(result.properties).to.have.length(4);
				expect(result.properties).to.deep.equal([
					{ name: 'id', type: 'VARCHAR' },
					{ name: 'username', type: 'VARCHAR' },
					{ name: 'email', type: 'VARCHAR' },
					{ name: 'created_timestamp', type: 'TIMESTAMP' },
				]);
				expect(result.data).to.be.an('array');
				expect(result.data).to.have.length(5);
				const [user1, user2, user3, user4, user5] = result.data;
				expect(user1.id).to.be.equal('user-1');
				expect(user1.username).to.be.equal('krha');
				expect(user1.email).to.be.equal('krha@example.com');
				expect(user1.created_timestamp).to.be.a('string');
				expect(user2.id).to.be.equal('user-2');
				expect(user2.username).to.be.equal('sheep');
				expect(user2.email).to.be.equal('sheep@example.com');
				expect(user2.created_timestamp).to.be.a('string');
				expect(user3.id).to.be.equal('user-3');
				expect(user3.username).to.be.equal('painter');
				expect(user3.email).to.be.equal('painter@example.com');
				expect(user3.created_timestamp).to.be.a('string');
				expect(user4.id).to.be.equal('user-4');
				expect(user4.username).to.be.equal('sloth-with-weird-worldview');
				expect(user4.email).to.be.equal('sloth-with-weird-worldview@example.com');
				expect(user4.created_timestamp).to.be.a('string');
				expect(user5.id).to.be.equal('user-5');
				expect(user5.username).to.be.equal('draculas-cousin');
				expect(user5.email).to.be.equal('draculas-cousin@example.com');
				expect(user5.created_timestamp).to.be.a('string');
			});

			it('should insert the command', async () => {
				const result = await mysql.query(
					"INSERT INTO commands (id, user_id, command) VALUES ('test', 'user-1', 'insert-command')",
				);
				await result.commit();
				expect(result).to.have.all.keys('data', 'properties', 'command', 'rowCount', 'commit', 'rollback');
				expect(result.rollback).to.be.a('function');
				expect(result.commit).to.be.a('function');
				expect(result.command).to.be.equal('insert');
				expect(result.rowCount).to.be.equal(1);
				expect(result.properties).to.be.an('array');
				expect(result.properties).to.have.length(0);
				expect(result.properties).to.deep.equal([]);
				expect(result.data).to.be.an('array');
				expect(result.data).to.have.length(0);
				expect(result.data).to.deep.equal([]);
				const rows = (await mysqlQuery('SELECT * FROM commands')) as any[];
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(1);
				const [row] = rows;
				expect(row.id).to.be.equal('test');
				expect(row.user_id).to.be.equal('user-1');
				expect(row.command).to.be.equal('insert-command');
				expect(row.created_timestamp).to.be.an.instanceOf(Date);
			});

			it('should update the command', async () => {
				await mysqlQuery(
					"INSERT INTO commands (id, user_id, command) VALUES ('test', 'user-1', 'insert-command')",
				);
				const result = await mysql.query("UPDATE commands SET command = 'update-command' WHERE id = 'test'");
				await result.commit();
				expect(result).to.have.all.keys('data', 'properties', 'command', 'rowCount', 'commit', 'rollback');
				expect(result.rollback).to.be.a('function');
				expect(result.commit).to.be.a('function');
				expect(result.command).to.be.equal('update');
				expect(result.rowCount).to.be.equal(1);
				expect(result.properties).to.be.an('array');
				expect(result.properties).to.have.length(0);
				expect(result.properties).to.deep.equal([]);
				expect(result.data).to.be.an('array');
				expect(result.data).to.have.length(0);
				expect(result.data).to.deep.equal([]);
				const rows = (await mysqlQuery('SELECT * FROM commands')) as any[];
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(1);
				const [row] = rows;
				expect(row.id).to.be.equal('test');
				expect(row.user_id).to.be.equal('user-1');
				expect(row.command).to.be.equal('update-command');
				expect(row.created_timestamp).to.be.an.instanceOf(Date);
			});

			it('should delete the command', async () => {
				await mysqlQuery(
					"INSERT INTO commands (id, user_id, command) VALUES ('test', 'user-1', 'insert-command')",
				);
				const result = await mysql.query("DELETE FROM commands WHERE id = 'test'");
				await result.commit();
				expect(result).to.have.all.keys('data', 'properties', 'command', 'rowCount', 'commit', 'rollback');
				expect(result.rollback).to.be.a('function');
				expect(result.commit).to.be.a('function');
				expect(result.command).to.be.equal('delete');
				expect(result.rowCount).to.be.equal(1);
				expect(result.properties).to.be.an('array');
				expect(result.properties).to.have.length(0);
				expect(result.properties).to.deep.equal([]);
				expect(result.data).to.be.an('array');
				expect(result.data).to.have.length(0);
				expect(result.data).to.deep.equal([]);
				const rows = await mysqlQuery('SELECT * FROM commands');
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(0);
			});
		});
	});
});
