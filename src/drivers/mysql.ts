import mysql, { Pool } from 'mysql2/promise';
import Logger from '../logger';
import Password from '../password-providers/password';
import BaseDriver from './base';
import { ICollectionPropertyDescription, IIndexDescription, IQueryResult, ISqlDriver } from './interfaces';

export interface IMysqlCredentials {
	host: string;
	port: number;
	username: string;
	database: string;
	sslRejectUnauthorized?: boolean;
	disableSsl?: boolean;
}

export default class MysqlDriver<U> extends BaseDriver<IMysqlCredentials, U> implements ISqlDriver {
	private _pool: Pool | null = null;

	private _password: Password | null = null;

	public reconnect(): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public getCollections(): Promise<string[]> {
		throw new Error('Method not implemented.');
	}

	public describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
		throw new Error('Method not implemented.');
	}

	public getViews(): Promise<string[]> {
		throw new Error('Method not implemented.');
	}

	public getIndexes(collectionName: string): Promise<IIndexDescription[]> {
		throw new Error('Method not implemented.');
	}

	public query<T>(query: string): Promise<IQueryResult<T>> {
		throw new Error('Method not implemented.');
	}

	public getTag(): string {
		return 'mysql';
	}

	public getName(): string {
		return 'MySQL';
	}

	protected async _connect(): Promise<void> {
		this._password = await this._passwordProvider.getPassword();
		const host = this._getHost();
		const port = this._getPort();
		Logger.info(this, `Connecting to MySQL at ${host}:${port}`);
		this._pool = mysql.createPool({
			host,
			port,
			user: this._credentials.username,
			password: this._password.password,
			database: this._credentials.database,
			ssl: this._credentials.disableSsl
				? undefined
				: { rejectUnauthorized: this._credentials.sslRejectUnauthorized ?? true },
		});
		this._pool.on('connection', (client) => {
			client.query('SET SESSION max_execution_time = 30000');
		});
		await this._pool.query('SELECT NOW()');
	}

	protected async _close(): Promise<void> {
		await this._pool?.end();
		this._pool = null;
		this._password = null;
	}

	private _getHost(): string {
		return (this._sshTunnel?.getLocalHost() ?? this._credentials.host) as string;
	}

	private _getPort(): number {
		return (this._sshTunnel?.getLocalPort() ?? this._credentials.port) as number;
	}
}
