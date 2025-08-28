import { Pool } from 'mysql2';
import Password from '../password-providers/password';
import BaseDriver from './base';
import { ICollectionPropertyDescription, IIndexDescription, IQueryResult, ISqlDriver } from './interfaces';

export interface IMysqlCredentials {
	host: string;
	port: number;
	username: string;
	database: string;
}

export default class MysqlDriver<U> extends BaseDriver<IMysqlCredentials, U> implements ISqlDriver {
	private _pool: Pool | null = null;

	private _password: Password | null = null;

	private _connected: boolean = false;

	public connect(): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public close(): Promise<void> {
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

	public isConnected(): boolean {
		throw new Error('Method not implemented.');
	}
}
