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
import BaseDriver from './base';
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

	public async getCollections(): Promise<string[]> {
		const { data } = await this._query<{ table_name: string }>('SHOW TABLES', true);
		return data.map((row) => row.table_name);
	}

	public async describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
		const { data } = await this._query<ICollectionPropertyDescriptionRecord>(`DESCRIBE ${collectionName}`, true);
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

	public async getViews(): Promise<string[]> {
		const { data } = await this._query<{ table_name: string }>(`SHOW FULL TABLES WHERE Table_type = 'VIEW'`, true);
		return data.map((row) => row.table_name);
	}

	public async getIndexes(collectionName: string): Promise<IIndexDescription[]> {
		const { data } = await this._query<ICollectionIndexRecord>(`SHOW INDEXES FROM ${collectionName}`, true);
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

	public query<T>(query: string): Promise<IQueryResult<T>> {
		return this._query(query);
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
			database: this._credentials.database,
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
			client.query('SET SESSION max_execution_time = 30000');
		});
		await this._pool.query('SELECT NOW()');
	}

	protected async _close(): Promise<void> {
		await this._pool?.end();
		this._pool = null;
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
			Logger.warn(this, 'Password expired, reconnecting...');
			await this.reconnect();
			return this._query<T>(query, autocommit as boolean, params as any[]);
		}
		const start = Date.now();
		Logger.info('query', `Executing query: ${query}`, {
			params,
		});
		let client: PoolConnection | null = null;
		try {
			client = await this._pool.getConnection();
			await client.query('BEGIN');
			const [result, fieldPacket] = await client.query(query, params);
			const duration = Date.now() - start;
			const { data, rowCount, command } = this._transformResult<T>(result, query);
			Logger.info('query', `Executed query: ${query}`, {
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
			if (autocommit) {
				await client?.query('COMMIT');
				Logger.info('query', `Autocommit enabled, committed transaction for query: ${query}`);
				client?.release();
			}
			return {
				data,
				properties,
				rowCount,
				command,
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
