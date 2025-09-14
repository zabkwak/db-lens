import { expect } from 'chai';
import path from 'path';
import { Pool } from 'pg';
import SSHTunnel from '../../../src/connection/ssh-tunnel';
import StatementTimeoutError from '../../../src/drivers/errors/statement-timeout.error';
import PostgresDriver from '../../../src/drivers/postgres';
import ConfigPasswordProvider from '../../../src/password-providers/config-provider';
import Password from '../../../src/password-providers/password';
import { cleanup, postgresQuery } from '../utils';

interface IUser {
	id: string;
	username: string;
	email: string;
	created_timestamp: string;
}

describe('PostgreSQL Driver', () => {
	afterEach(async () => {
		await postgresQuery('TRUNCATE TABLE commands');
		await cleanup();
	});

	describe('.connect', () => {
		it('should throw an error for wrong port', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5433,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await expect(postgres.connect()).to.be.rejectedWith('ECONNREFUSED');
		});

		it('should throw an error for wrong password', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'testaaa',
				}),
			);
			await expect(postgres.connect()).to.be.rejectedWith('password authentication failed for user "db-lens"');
		});

		it('should connect to the database', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await postgres.connect();
			expect(postgres.isConnected()).to.be.true;
			// @ts-expect-error
			expect(postgres._pool).to.be.an.instanceOf(Pool);
			// @ts-expect-error
			expect(postgres._password).to.be.an.instanceOf(Password);
			await postgres.close();
		});

		it('should throw an error that ssh tunnel is not open', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
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
					remotePort: 5432,
					remoteHost: 'postgres',
					strictHostChecking: false,
					userKnownHostsFile: '/dev/null',
				}),
			);
			await expect(postgres.connect()).to.be.rejectedWith('SSH tunnel is not open');
			expect(postgres.isConnected()).to.be.false;
		});

		it('should connect to the database using ssh tunnel', async () => {
			const tunnel = new SSHTunnel({
				host: 'localhost',
				port: 2222,
				username: 'testuser',
				privateKey: path.resolve(__dirname, '../../ssh_key'),
				passphrase: null,
				localPort: 1111,
				localHost: 'localhost',
				remotePort: 5432,
				remoteHost: 'postgres',
				strictHostChecking: false,
				userKnownHostsFile: '/dev/null',
			});
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
				tunnel,
			);
			await tunnel.open();
			await postgres.connect();
			expect(postgres.isConnected()).to.be.true;
			// @ts-expect-error
			expect(postgres._pool).to.be.an.instanceOf(Pool);
			// @ts-expect-error
			expect(postgres._password).to.be.an.instanceOf(Password);
			await postgres.close();
			await tunnel.close();
		});
	});

	describe('.reconnect', () => {
		it('should throw an error if database is not connected', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await expect(postgres.reconnect()).to.be.rejectedWith('Database not connected');
		});

		it('should reconnect the database', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'test',
				}),
			);
			await postgres.connect();
			expect(postgres.isConnected()).to.be.true;
			await postgres.reconnect();
			expect(postgres.isConnected()).to.be.true;
		});
	});

	describe('.close', () => {
		it('should close the database connection', async () => {
			const postgres = new PostgresDriver(
				{
					host: 'localhost',
					port: 5432,
					username: 'db-lens',
					database: 'postgres',
					schema: 'public',
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
		const postgres = new PostgresDriver(
			{
				host: 'localhost',
				port: 5432,
				username: 'db-lens',
				database: 'postgres',
				schema: 'public',
				disableSsl: true,
			},
			new ConfigPasswordProvider({
				password: 'test',
			}),
		);

		beforeEach(async () => {
			await postgres.connect();
		});

		afterEach(async () => {
			await postgres.close();
		});

		describe('.getNamespaces', () => {
			it('should return list of namespaces', async () => {
				const namespaces = await postgres.getNamespaces();
				expect(namespaces).to.be.an('array');
				expect(namespaces).to.deep.equal(['information_schema', 'pg_catalog', 'pg_toast', 'public']);
			});
		});

		describe('.getCollections', () => {
			it('should return list of collections', async () => {
				const collections = await postgres.getCollections('public');
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal(['commands', 'users']);
			});
		});

		describe('.getViews', () => {
			afterEach(async () => {
				await postgresQuery('DROP VIEW IF EXISTS test_view');
			});

			it('should return list of views', async () => {
				await postgresQuery('CREATE VIEW test_view AS SELECT * FROM users');
				const collections = await postgres.getViews('public');
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal(['test_view']);
			});

			it('should return empty list of views', async () => {
				const collections = await postgres.getViews('public');
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal([]);
			});
		});

		describe('.getIndexes', () => {
			afterEach(async () => {
				try {
					await postgresQuery('DROP INDEX username_email');
				} catch (e) {}
			});

			it('should return list of indexes for users table', async () => {
				const collections = await postgres.getIndexes('public', 'users');
				expect(collections).to.be.an('array');
				expect(collections).to.deep.equal([
					{
						name: 'users_pkey',
						kind: 'PRIMARY KEY',
						type: 'btree',
						columns: ['id'],
					},
					{
						name: 'users_username_key',
						kind: 'UNIQUE',
						type: 'btree',
						columns: ['username'],
					},
					{
						name: 'users_email_key',
						kind: 'UNIQUE',
						type: 'btree',
						columns: ['email'],
					},
				]);
			});

			it('should return list of indexes with combined index added', async () => {
				await postgresQuery('CREATE INDEX username_email ON users (username, email)');
				const indexes = await postgres.getIndexes('public', 'users');
				expect(indexes).to.be.an('array');
				expect(indexes).to.deep.equal([
					{
						name: 'users_pkey',
						kind: 'PRIMARY KEY',
						type: 'btree',
						columns: ['id'],
					},
					{
						name: 'users_username_key',
						kind: 'UNIQUE',
						type: 'btree',
						columns: ['username'],
					},
					{
						name: 'users_email_key',
						kind: 'UNIQUE',
						type: 'btree',
						columns: ['email'],
					},
					{
						name: 'username_email',
						kind: 'INDEX',
						type: 'btree',
						columns: ['username', 'email'],
					},
				]);
			});
		});

		describe('.describeCollection', () => {
			it('should describe table', async () => {
				const properties = await postgres.describeCollection('public', 'users');
				expect(properties).to.be.an('array');
				expect(properties).to.deep.equal([
					{
						name: 'id',
						type: 'character varying',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: true,
					},
					{
						name: 'username',
						type: 'character varying',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: false,
					},
					{
						name: 'email',
						type: 'character varying',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: false,
					},
					{
						name: 'created_timestamp',
						type: 'timestamp without time zone',
						isNullable: false,
						defaultValue: 'now()',
						isPrimaryKey: false,
					},
				]);
			});
		});

		describe('.query', () => {
			it('should throw a not connected error', async () => {
				await postgres.close();
				await expect(postgres.query<IUser>('select * from users')).to.be.rejectedWith('Database not connected');
			});

			it('should throw an error for invalid relation in non-existing schema', async () => {
				await expect(postgres.query<IUser>('select * from users', 5000, 'test')).to.be.rejectedWith(
					'relation "users" does not exist',
				);
			});

			it('should return all users', async () => {
				const result = await postgres.query<IUser>('select * from users');
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
				const result = await postgres.query(
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
				const rows = await postgresQuery('SELECT * FROM commands');
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(1);
				const [row] = rows;
				expect(row.id).to.be.equal('test');
				expect(row.user_id).to.be.equal('user-1');
				expect(row.command).to.be.equal('insert-command');
				expect(row.created_timestamp).to.be.a('string');
			});

			it('should update the command', async () => {
				await postgresQuery(
					"INSERT INTO commands (id, user_id, command) VALUES ('test', 'user-1', 'insert-command')",
				);
				const result = await postgres.query("UPDATE commands SET command = 'update-command' WHERE id = 'test'");
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
				const rows = await postgresQuery('SELECT * FROM commands');
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(1);
				const [row] = rows;
				expect(row.id).to.be.equal('test');
				expect(row.user_id).to.be.equal('user-1');
				expect(row.command).to.be.equal('update-command');
				expect(row.created_timestamp).to.be.a('string');
			});

			it('should delete the command', async () => {
				await postgresQuery(
					"INSERT INTO commands (id, user_id, command) VALUES ('test', 'user-1', 'insert-command')",
				);
				const result = await postgres.query("DELETE FROM commands WHERE id = 'test'");
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
				const rows = await postgresQuery('SELECT * FROM commands');
				expect(rows).to.be.an('array');
				expect(rows).to.have.length(0);
			});

			it('should fail on execution timeout', async () => {
				await expect(postgres.query('select pg_sleep(2)', 1))
					.to.eventually.be.rejectedWith(
						StatementTimeoutError,
						'canceling statement due to statement timeout',
					)
					.and.to.have.property('code', 'ERR_STATEMENT_TIMEOUT');
			});
		});
	});
});
