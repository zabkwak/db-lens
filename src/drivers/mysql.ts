import mysql, {
	FieldPacket,
	OkPacket,
	Pool,
	PoolConnection,
	QueryResult,
	ResultSetHeader,
	RowDataPacket,
} from 'mysql2/promise';
import assert from 'node:assert';
import { EQueryCommand } from '../../shared/types';
import Logger from '../logger';
import BaseDriver, { DEFAULT_EXECUTION_TIMEOUT } from './base';
import StatementTimeoutError from './errors/statement-timeout.error';
import {
	ICollectionPropertyDescription,
	IIndexDescription,
	IQueryResult,
	IQueryResultCollectionPropertyDescription,
	ISqlDriver,
} from './interfaces';
import { getCommandFromQuery } from './sql/utils';

export interface IMysqlCredentials {
	host: string;
	port: number;
	username: string;
	/** @deprecated */
	database: string;
	sslRejectUnauthorized?: boolean;
	disableSsl?: boolean;
}

interface ICollectionPropertyDescriptionRecord {
	Field: string;
	Type: string;
	Default: string | null;
	Extra: string;
	Key: string;
	Null: 'YES' | 'NO';
}

interface ICollectionIndexRecord {
	Cardinality: number;
	Collation: string;
	Column_name: string;
	Comment: string;
	Expression: string | null;
	Index_comment: string;
	Index_type: string;
	Key_name: string;
	Non_unique: number;
	Null: string;
	Packed: string | null;
	Seq_in_index: number;
	Sub_part: number | null;
	Table: string;
	Visible: 'YES' | 'NO';
}

interface ITransformResult<T> {
	data: T[];
	rowCount: number;
	command: EQueryCommand;
}

export default class MysqlDriver<U> extends BaseDriver<IMysqlCredentials, U> implements ISqlDriver {
	private _pool: Pool | null = null;

	public async getNamespaces(): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ Database: string }>(`SHOW DATABASES`);
		await commit();
		return data.map((row) => row.Database);
	}

	public async getCollections(namespace: string): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ table_name: string }>('SHOW TABLES', namespace);
		await commit();
		return data.map((row) => row.table_name);
	}

	public async describeCollection(
		namespace: string,
		collectionName: string,
	): Promise<ICollectionPropertyDescription[]> {
		const { data, commit } = await this._executeQuery<ICollectionPropertyDescriptionRecord>(
			`DESCRIBE \`${collectionName}\``,
			namespace,
		);
		await commit();
		return data.map((record) => {
			return {
				name: record.Field,
				type: record.Type,
				isNullable: record.Null === 'YES',
				defaultValue: record.Default,
				isPrimaryKey: record.Key === 'PRI',
			};
		});
	}

	public async getViews(namespace: string): Promise<string[]> {
		const { data, commit } = await this._executeQuery<{ table_name: string }>(
			`SHOW FULL TABLES WHERE Table_type = 'VIEW'`,
			namespace,
		);
		await commit();
		return data.map((row) => row.table_name);
	}

	public async getIndexes(namespace: string, collectionName: string): Promise<IIndexDescription[]> {
		const { data, commit } = await this._executeQuery<ICollectionIndexRecord>(
			`SHOW INDEXES FROM \`${collectionName}\``,
			namespace,
		);
		await commit();
		return data.reduce((acc, record) => {
			if (!acc.find((idx) => idx.name === record.Key_name)) {
				let kind: IIndexDescription['kind'] = 'INDEX';
				if (record.Key_name === 'PRIMARY') {
					kind = 'PRIMARY KEY';
				} else if (record.Non_unique === 0) {
					kind = 'UNIQUE';
				}
				return [
					...acc,
					{
						name: record.Key_name,
						kind,
						type: record.Index_type,
						columns: [record.Column_name],
					},
				];
			}
			return acc.map((index) => {
				if (index.name === record.Key_name) {
					return {
						...index,
						columns: [...index.columns, record.Column_name],
					};
				}
				return index;
			});
		}, [] as IIndexDescription[]);
	}

	public getTag(): string {
		return 'mysql';
	}

	public getName(): string {
		return 'MySQL';
	}

	protected async _connect(): Promise<void> {
		assert(this._password, 'Password should be defined');
		const host = this._getHost();
		const port = this._getPort();
		Logger.info(this, `Connecting to MySQL at ${host}:${port}`);
		this._pool = mysql.createPool({
			host,
			port,
			user: this._credentials.username,
			password: this._password.password,
			// database: this._credentials.database,
			ssl: this._credentials.disableSsl
				? undefined
				: { rejectUnauthorized: this._credentials.sslRejectUnauthorized ?? true },
			typeCast: (field, next) => {
				if (field.type === 'DATE' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
					return field.string();
				}
				return next();
			},
		});
		this._pool.on('connection', (client) => {
			client.query(`SET SESSION max_execution_time = ${DEFAULT_EXECUTION_TIMEOUT}`);
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
			database: namespace,
			timeout,
			params,
		});
		let client: PoolConnection | null = null;
		try {
			client = await this._pool.getConnection();
			await client.query(`SET SESSION max_execution_time = ${timeout}`);
			if (namespace) {
				await client.query(`USE \`${namespace}\``);
			}
			await client.query('BEGIN');
			const [result, fieldPacket] = await client.query(query, params);
			const duration = Date.now() - start;
			const { data, rowCount, command } = this._transformResult<T>(result, query);
			Logger.info('query', `Executed query: ${query}`, {
				database: namespace,
				params,
				duration: `${duration}ms`,
				rowCount,
			});
			const properties =
				fieldPacket?.map((field): IQueryResultCollectionPropertyDescription => {
					return {
						name: field.name,
						type: this._convertColumnType(field),
					};
				}) || [];
			return {
				data,
				properties,
				rowCount,
				command,
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
			if (error.message === 'Query execution was interrupted, maximum statement execution time exceeded') {
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

	private _convertColumnType(field: FieldPacket): string {
		let type = field.typeName;
		if (!type) {
			if (!field.type) {
				return 'unknown';
			}
			// @ts-expect-error
			type = mysql.Types[field.type.toString()] || 'unknown';
		}
		switch (type) {
			case 'VAR_STRING':
				return 'VARCHAR';
			default:
				return type as string;
		}
	}

	private _transformResult<T>(result: QueryResult, query: string): ITransformResult<T> {
		if (Array.isArray(result)) {
			if (!result.length) {
				return {
					data: [],
					rowCount: 0,
					command: EQueryCommand.SELECT,
				};
			}
			const keys = Object.keys(result[0]);
			if (keys.some((key) => key === `Tables_in_${this._credentials.database}`)) {
				const key = `Tables_in_${this._credentials.database}`;
				const data = result.map((row): T => {
					assert(!Array.isArray(row), 'Expected row not to be an array');
					assert(
						!this._isRowOkPacket(row) && !this._isRowResultSetHeader(row),
						'Expected row not to be a result set header or OK packet',
					);
					return { table_name: row[key] } as T;
				});
				return {
					data,
					rowCount: data.length,
					command: EQueryCommand.SELECT,
				};
			}
			return {
				data: result as T[],
				rowCount: result.length,
				// TODO ?
				command: EQueryCommand.SELECT,
			};
		}
		if (this._isRowResultSetHeader(result) || this._isRowOkPacket(result)) {
			assert(!this._isRowOkPacket(result), 'Expected result not to be a deprecated OkPacket');
			if (!result.info) {
				if (result.insertId) {
					return {
						data: [],
						rowCount: result.affectedRows,
						command: EQueryCommand.INSERT,
					};
				}
				return {
					data: [],
					rowCount: result.affectedRows,
					command: getCommandFromQuery(query),
				};
			}
			return {
				data: [],
				rowCount: result.affectedRows,
				command: EQueryCommand.UPDATE,
			};
		}
		throw new Error('Unexpected result format from MySQL query');
	}

	private _getHost(): string {
		return (this._sshTunnel?.getLocalHost() ?? this._credentials.host) as string;
	}

	private _getPort(): number {
		return (this._sshTunnel?.getLocalPort() ?? this._credentials.port) as number;
	}

	private _isRowResultSetHeader(
		row: OkPacket | ResultSetHeader | RowDataPacket | RowDataPacket[],
	): row is ResultSetHeader {
		return 'affectedRows' in row && 'info' in row;
	}

	private _isRowOkPacket(row: OkPacket | ResultSetHeader | RowDataPacket | RowDataPacket[]): row is OkPacket {
		return 'affectedRows' in row && !this._isRowResultSetHeader(row);
	}
}
