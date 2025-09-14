import assert from 'node:assert';
import { Pool, PoolClient, types } from 'pg';
import Logger, { ILoggingInstance } from '../logger';
import BaseDriver, { DEFAULT_EXECUTION_TIMEOUT } from './base';
import StatementTimeoutError from './errors/statement-timeout.error';
import {
	ICollectionPropertyDescription,
	IIndexDescription,
	IQueryResult,
	IQueryResultCollectionPropertyDescription,
	ISqlDriver,
} from './interfaces';
import { getCommand } from './sql/utils';

export interface IPostgresCredentials {
	host: string;
	port: number;
	username: string;
	database: string;
	sslRejectUnauthorized?: boolean;
	disableSsl?: boolean;
}

interface ICollectionPropertyDescriptionRecord {
	name: string;
	type: string;
	is_nullable: 'YES' | 'NO';
	default_value: string | null;
	is_primary_key: boolean;
}

interface ICollectionIndexRecord {
	name: string;
	kind: 'PRIMARY KEY' | 'UNIQUE' | 'INDEX';
	type: string;
	columns: string;
	condition: string | null;
}

// OID 1082 = DATE, 1114 = TIMESTAMP, 1184 = TIMESTAMPTZ
types.setTypeParser(1082, (val) => val);
types.setTypeParser(1114, (val) => val);
types.setTypeParser(1184, (val) => val);

export default class PostgresDriver<U>
	extends BaseDriver<IPostgresCredentials, U>
	implements ISqlDriver, ILoggingInstance
{
	private _pool: Pool | null = null;

	public async getNamespaces(): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ nspname: string }>(
			`SELECT nspname FROM pg_catalog.pg_namespace ORDER BY nspname ASC`,
			null,
		);
		await commit();
		return data.map((row) => row.nspname);
	}

	public async getCollections(namespace: string): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ tablename: string }>(
			`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = $1 order by tablename asc`,
			null,
			[namespace],
		);
		await commit();
		return data.map((row) => row.tablename);
	}

	public async describeCollection(
		namespace: string,
		collectionName: string,
	): Promise<ICollectionPropertyDescription[]> {
		const { data, commit } = await this._executeQuery<ICollectionPropertyDescriptionRecord>(
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
	c.table_schema = $1
    AND c.table_name = $2`,
			null,
			[namespace, collectionName],
		);
		await commit();
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

	public async getViews(namespace: string): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ viewname: string }>(
			`SELECT viewname FROM pg_catalog.pg_views WHERE schemaname = $1 order by viewname asc`,
			null,
			[namespace],
		);
		await commit();
		return data.map((row) => row.viewname);
	}

	public async getIndexes(namespace: string, collectionName: string): Promise<IIndexDescription[]> {
		const { data, commit } = await this._executeQuery<ICollectionIndexRecord>(
			`SELECT
    i.relname AS name,
    CASE
        WHEN idx.indisprimary THEN 'PRIMARY KEY'
        WHEN idx.indisunique  THEN 'UNIQUE'
        ELSE 'INDEX'
    END AS kind,
    am.amname AS type,
    array_to_string(
        ARRAY(
            SELECT pg_get_indexdef(idx.indexrelid, k + 1, TRUE)
            FROM generate_subscripts(idx.indkey, 1) AS k
            ORDER BY k
        ), ','
    ) AS columns,
    pg_get_expr(idx.indpred, idx.indrelid) AS condition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_am am ON i.relam = am.oid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE t.relname = $1
  AND n.nspname = $2;`,
			null,
			[collectionName, namespace],
		);
		await commit();
		return data.map((row): IIndexDescription => {
			return {
				name: row.name,
				kind: row.kind,
				type: row.type,
				columns: row.columns.split(','),
			};
		});
	}

	public getTag(): string {
		return 'postgres';
	}

	public getName(): string {
		return 'PostgreSQL';
	}

	protected async _connect(): Promise<void> {
		assert(this._password, 'Password should be defined');
		const host = this._getHost();
		const port = this._getPort();
		Logger.info(this, `Connecting to PostgreSQL at ${host}:${port}`);
		this._pool = new Pool({
			host,
			port,
			user: this._credentials.username,
			password: this._password.password,
			database: this._credentials.database,
			ssl: this._credentials.disableSsl
				? false
				: { rejectUnauthorized: this._credentials.sslRejectUnauthorized ?? true },
			statement_timeout: DEFAULT_EXECUTION_TIMEOUT,
		});
		await this._pool.query('SELECT NOW()');
	}

	protected async _close(): Promise<void> {
		await this._pool?.end();
		this._pool = null;
	}

	protected async _query<T>(query: string, timeout: number, namespace: string | null): Promise<IQueryResult<T>> {
		return this._executeQuery<T>(query, namespace, [], timeout);
	}

	private async _executeQuery<T>(query: string): Promise<IQueryResult<T>>;
	private async _executeQuery<T>(query: string, namespace: string | null): Promise<IQueryResult<T>>;
	private async _executeQuery<T>(query: string, namespace: string | null, params: any[]): Promise<IQueryResult<T>>;
	private async _executeQuery<T>(
		query: string,
		namespace: string | null,
		params: any[],
		timeout: number,
	): Promise<IQueryResult<T>>;
	private async _executeQuery<T>(
		query: string,
		namespace: string | null = null,
		params?: any[],
		timeout: number = DEFAULT_EXECUTION_TIMEOUT,
	): Promise<IQueryResult<T>> {
		if (!this._pool) {
			throw new Error('Database not connected');
		}
		await this._checkPassword();
		const start = Date.now();
		Logger.info('query', `Executing query: ${query}`, {
			schema: namespace,
			timeout,
			params,
		});
		let client: PoolClient | null = null;
		try {
			client = await this._pool.connect();
			await client.query(`SET statement_timeout = ${timeout}`);
			if (namespace) {
				await client.query(`SET search_path TO ${namespace}`);
			}
			await client.query('BEGIN');
			const { rows, fields, rowCount, command } = await client.query(query, params);
			const duration = Date.now() - start;
			Logger.info('query', `Executed query: ${query}`, {
				schema: namespace,
				params,
				duration: `${duration}ms`,
				rowCount,
			});
			const properties = fields.map((field): IQueryResultCollectionPropertyDescription => {
				const typeName =
					Object.entries(types.builtins).find(([name, id]) => id === field.dataTypeID)?.[0] || 'unknown';
				return {
					name: field.name,
					type: typeName,
				};
			});
			return {
				data: rows as T[],
				properties,
				rowCount,
				command: getCommand(command),
				commit: async () => {
					await client?.query('COMMIT');
					Logger.info('query', `Committed transaction for query: ${query}`);
					client?.release();
				},
				rollback: async () => {
					await client?.query('ROLLBACK');
					Logger.info('query', `Rolled back transaction for query: ${query}`);
					client?.release();
				},
			};
		} catch (error: any) {
			await client?.query('ROLLBACK');
			client?.release();
			if (error.message === 'canceling statement due to statement timeout') {
				error = new StatementTimeoutError(error.message);
			}
			Logger.error('query', `Error executing query: ${query} - ${error}`, {
				error: {
					message: error.message,
					...error,
				},
			});
			throw error;
		}
	}

	private _getHost(): string {
		return (this._sshTunnel?.getLocalHost() ?? this._credentials.host) as string;
	}

	private _getPort(): number {
		return (this._sshTunnel?.getLocalPort() ?? this._credentials.port) as number;
	}
}
