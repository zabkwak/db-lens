import { expect } from 'chai';
import path from 'path';
import SSHTunnel from '../../../src/connection/ssh-tunnel';
import MySqlDriver from '../../../src/drivers/mysql';
import ConfigPasswordProvider from '../../../src/password-providers/config-provider';
import Password from '../../../src/password-providers/password';
import { cleanup } from '../utils';

interface IUser {
	id: string;
	username: string;
	email: string;
	created_timestamp: string;
}

describe('MySQL Driver', () => {
	afterEach(async () => {
		await cleanup();
	});

	describe('.connect', () => {
		it('should throw an error for wrong port', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3307,
					username: 'db-lens',
					database: 'mysql',
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
					database: 'mysql',
					disableSsl: true,
				},
				new ConfigPasswordProvider({
					password: 'testaaa',
				}),
			);
			await expect(mysql.connect()).to.be.rejectedWith(
				"Access denied for user 'db-lens'@'172.19.0.1' (using password: YES)",
			);
		});

		it('should connect to the database', async () => {
			const mysql = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'mysql',
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
					database: 'mysql',
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

		it('should connect to the database using ssh tunnel', async () => {
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
					database: 'mysql',
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

	describe('.close', () => {
		it('should close the database connection', async () => {
			const postgres = new MySqlDriver(
				{
					host: 'localhost',
					port: 3306,
					username: 'db-lens',
					database: 'mysql',
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
});
