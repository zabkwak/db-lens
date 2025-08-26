import { Pool, PoolClient, types } from 'pg';
import { EQueryCommand } from '../../shared/types';
import Logger from '../logger';
import Password from '../password-providers/password';
import BaseDriver from './base';
import {
	ICollectionPropertyDescription,
	IQueryResult,
	IQueryResultCollectionPropertyDescription,
	IViewDriver,
} from './interfaces';

export interface IPostgresCredentials {
	host: string;
	port: number;
	username: string;
	database: string;
	sslRejectUnauthorized?: boolean;
	schema?: string;
	disableSsl?: boolean;
}

interface ICollectionPropertyDescriptionRecord {
	name: string;
	type: string;
	is_nullable: 'YES' | 'NO';
	default_value: string | null;
	is_primary_key: boolean;
}

// OID 1082 = DATE, 1114 = TIMESTAMP, 1184 = TIMESTAMPTZ
types.setTypeParser(1082, (val) => val);
types.setTypeParser(1114, (val) => val);
types.setTypeParser(1184, (val) => val);

export default class PostgresDriver<U> extends BaseDriver<IPostgresCredentials, U> implements IViewDriver {
	private _pool: Pool | null = null;

	private _password: Password | null = null;

	private _connected: boolean = false;

	public async connect(): Promise<void> {
		if (this._pool) {
			return;
		}
		await this._connect();
		Logger.info('postgres', 'Connected to PostgreSQL');
	}

	public async reconnect(): Promise<void> {
		if (!this._pool) {
			throw new Error('Database not connected');
		}
		await this._pool.end();
		this._connected = false;
		Logger.info('postgres', `Reconnecting to PostgreSQL at ${this._getHost()}:${this._getPort()}`);
		await this._connect();
	}

	public async close(): Promise<void> {
		await this._pool?.end();
		this._pool = null;
		this._password = null;
		this._connected = false;
		Logger.info('postgres', 'Connection closed');
	}

	public async getCollections(): Promise<string[]> {
		const { data } = await this._query<{ tablename: string }>(
			`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = current_schema() order by tablename asc`,
			true,
		);
		return data.map((row) => row.tablename);
	}

	public async describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
		const { data } = await this._query<ICollectionPropertyDescriptionRecord>(
			`SELECT
    c.column_name AS name,
    c.data_type AS type,
    c.is_nullable,
    c.column_default AS default_value,
    (pk.column_name IS NOT NULL) AS is_primary_key
FROM
    information_schema.columns AS c
LEFT JOIN (
    SELECT
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name
    FROM
        information_schema.key_column_usage AS kcu
    JOIN
        information_schema.table_constraints AS tc
            ON kcu.constraint_name = tc.constraint_name
            AND kcu.table_schema = tc.table_schema
    WHERE
        tc.constraint_type = 'PRIMARY KEY'
) AS pk
    ON c.table_schema = pk.table_schema
    AND c.table_name = pk.table_name
    AND c.column_name = pk.column_name
WHERE
    c.table_name = $1`,
			true,
			[collectionName],
		);
		return data.map((record): ICollectionPropertyDescription => {
			return {
				name: record.name,
				type: record.type,
				isNullable: record.is_nullable === 'YES',
				defaultValue: record.default_value,
				isPrimaryKey: record.is_primary_key,
			};
		});
	}

	public async getViews(): Promise<string[]> {
		const { data } = await this._query<{ viewname: string }>(
			`SELECT viewname FROM pg_catalog.pg_views WHERE schemaname = current_schema() order by viewname asc`,
			true,
		);
		return data.map((row) => row.viewname);
	}

	public query<T>(query: string): Promise<IQueryResult<T>> {
		return this._query<T>(query, false);
	}

	public isConnected(): boolean {
		return this._connected;
	}

	private async _query<T>(query: string): Promise<IQueryResult<T>>;
	private async _query<T>(query: string, autocommit: boolean): Promise<IQueryResult<T>>;
	private async _query<T>(query: string, autocommit: boolean, params: any[]): Promise<IQueryResult<T>>;
	private async _query<T>(query: string, autocommit: boolean = true, params?: any[]): Promise<IQueryResult<T>> {
		if (!this._pool) {
			throw new Error('Database not connected');
		}
		if (!this._password) {
			throw new Error('Password not provided');
		}
		if (this._password.isExpired()) {
			Logger.warn('postgres', 'Password expired, reconnecting...');
			await this.reconnect();
			return this._query<T>(query, autocommit as boolean, params as any[]);
		}
		const start = Date.now();
		Logger.info('query', `Executing query: ${query}`, {
			params,
		});
		let client: PoolClient | null = null;
		try {
			client = await this._pool.connect();
			await client.query('BEGIN');
			const { rows, fields, rowCount, command } = await client.query(query, params);
			const duration = Date.now() - start;
			Logger.info('query', `Executed query: ${query} in ${duration}ms`);
			const properties = fields.map((field): IQueryResultCollectionPropertyDescription => {
				const typeName =
					Object.entries(types.builtins).find(([name, id]) => id === field.dataTypeID)?.[0] || 'unknown';
				return {
					name: field.name,
					type: typeName,
				};
			});
			if (autocommit) {
				await client?.query('COMMIT');
				Logger.info('query', `Autocommit enabled, committed transaction for query: ${query}`);
				client?.release();
			}
			return {
				data: rows as T[],
				properties,
				rowCount,
				command: this._getCommand(command),
				commit: async () => {
					if (autocommit) {
						return;
					}
					await client?.query('COMMIT');
					Logger.info('query', `Committed transaction for query: ${query}`);
					client?.release();
				},
				rollback: async () => {
					if (autocommit) {
						return;
					}
					await client?.query('ROLLBACK');
					Logger.info('query', `Rolled back transaction for query: ${query}`);
					client?.release();
				},
			};
		} catch (error: any) {
			await client?.query('ROLLBACK');
			client?.release();
			Logger.error('query', `Error executing query: ${query} - ${error}`, {
				error: {
					message: error.message,
					...error,
				},
			});
			throw error;
		}
	}

	private async _connect(): Promise<void> {
		if (this._sshTunnel && !this._sshTunnel.isOpen()) {
			throw new Error('SSH tunnel is not open');
		}
		this._password = await this._passwordProvider.getPassword();
		const host = this._getHost();
		const port = this._getPort();
		Logger.info('postgres', `Connecting to PostgreSQL at ${host}:${port}`);
		this._pool = new Pool({
			host,
			port,
			user: this._credentials.username,
			password: this._password.password,
			database: this._credentials.database,
			ssl: this._credentials.disableSsl
				? false
				: { rejectUnauthorized: this._credentials.sslRejectUnauthorized ?? true },
			statement_timeout: 30000,
		});
		const schema = this._credentials.schema || 'public';
		this._pool.on('connect', (client) => {
			client.query(`SET search_path TO ${schema}`);
		});
		try {
			await this._pool.query('SELECT NOW()');
			this._connected = true;
		} catch (error: any) {
			const message = error.message || error.code || 'Unknown error';
			Logger.error('postgres', `Error connecting to PostgreSQL: ${message}`, {
				error: {
					message,
					...error,
				},
			});
			throw new Error(message);
		}
	}

	private _getCommand(command: string): EQueryCommand {
		switch (command) {
			case 'UPDATE':
				return EQueryCommand.UPDATE;
			case 'INSERT':
				return EQueryCommand.INSERT;
			case 'DELETE':
				return EQueryCommand.DELETE;
			case 'SELECT':
				return EQueryCommand.SELECT;
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}

	private _getHost(): string {
		return (this._sshTunnel?.getLocalHost() ?? this._credentials.host) as string;
	}

	private _getPort(): number {
		return (this._sshTunnel?.getLocalPort() ?? this._credentials.port) as number;
	}
}
