import { Pool } from 'pg';
import types from 'pg-types';
import Logger from '../logger';
import Password from '../password-providers/password';
import BaseDriver, { ICollectionPropertyDescription, IQueryResultWithDescription } from './base';

export interface IPostgresCredentials {
	host: string;
	port: number;
	username: string;
	database: string;
	sslRejectUnauthorized?: boolean;
	schema?: string;
}

export default class PostgresDriver<U> extends BaseDriver<IPostgresCredentials, U> {
	private _pool: Pool | null = null;
	private _password: Password | null = null;

	public async connect(): Promise<void> {
		if (this._pool) {
			return;
		}
		Logger.info('postgres', `Connecting to PostgreSQL at ${this._credentials.host}:${this._credentials.port}`);
		await this._connect();
		Logger.info('postgres', 'Connected to PostgreSQL');
	}

	public async reconnect(): Promise<void> {
		if (!this._pool) {
			throw new Error('Database not connected');
		}
		await this._pool.end();
		Logger.info('postgres', `Reconnecting to PostgreSQL at ${this._credentials.host}:${this._credentials.port}`);
		await this._connect();
	}

	public async close(): Promise<void> {
		await this._pool?.end();
		this._pool = null;
		this._password = null;
		Logger.info('postgres', 'Connection closed');
	}

	public async getCollections(): Promise<string[]> {
		const result = await this.query<{ tablename: string }>(
			`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = current_schema() order by tablename asc`,
		);
		return result.map((row) => row.tablename);
	}

	public async describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
		const result = await this.query<ICollectionPropertyDescription>(
			`SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = $1`,
			[collectionName],
		);
		return result;
	}

	public queryWithDescription<T>(query: string): Promise<IQueryResultWithDescription<T>> {
		return this._query<T>(query);
	}

	public async query<T>(query: string, params?: any[]): Promise<T[]> {
		const { data } = await this._query<T>(query, params);
		return data;
	}

	private async _query<T>(query: string, params?: any[]): Promise<IQueryResultWithDescription<T>> {
		if (!this._pool) {
			throw new Error('Database not connected');
		}
		if (!this._password) {
			throw new Error('Password not provided');
		}
		if (this._password.isExpired()) {
			Logger.warn('postgres', 'Password expired, reconnecting...');
			await this.reconnect();
			return this._query<T>(query, params);
		}
		const start = Date.now();
		Logger.info('query', `Executing query with description: ${query} with params: ${JSON.stringify(params)}`);
		try {
			const { rows, fields } = await this._pool.query(query, params);
			const duration = Date.now() - start;
			Logger.info('query', `Executed query with description: ${query} in ${duration}ms`);
			const properties = fields.map((field) => {
				const typeName =
					Object.entries(types.builtins).find(([name, id]) => id === field.dataTypeID)?.[0] || 'unknown';
				return {
					name: field.name,
					type: typeName,
				};
			});
			return { data: rows as T[], properties };
		} catch (error: any) {
			Logger.error('query', `Error executing query with description: ${query} - ${error}`, {
				error: {
					message: error.message,
					...error,
				},
			});
			throw error;
		}
	}

	private async _connect(): Promise<void> {
		this._password = await this._passwordProvider.getPassword();
		this._pool = new Pool({
			host: this._credentials.host,
			port: this._credentials.port,
			user: this._credentials.username,
			password: this._password.password,
			database: this._credentials.database,
			ssl: { rejectUnauthorized: this._credentials.sslRejectUnauthorized ?? true },
			statement_timeout: 30000,
		});
		const schema = this._credentials.schema || 'public';
		this._pool.on('connect', (client) => {
			client.query(`SET search_path TO ${schema}`);
		});
	}
}
