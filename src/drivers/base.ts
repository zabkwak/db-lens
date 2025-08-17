import { EQueryCommand } from '../../shared/types';
import SSHTunnel from '../connection/ssh-tunnel';
import BasePasswordProvider from '../password-providers/base';

export interface ICollectionPropertyDescription {
	name: string;
	// TODO enum?
	type: string;
}

export interface IQueryResultWithDescription<T> {
	data: T[];
	properties: ICollectionPropertyDescription[];
	rowCount: number | null;
	command: EQueryCommand;
}

export default abstract class BaseDriver<T, U> {
	protected _credentials: T;

	protected _passwordProvider: BasePasswordProvider<U>;

	protected _sshTunnel: SSHTunnel | null = null;

	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>);
	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>, sshTunnel: SSHTunnel);
	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>, sshTunnel: SSHTunnel | null = null) {
		this._credentials = credentials;
		this._passwordProvider = passwordProvider;
		this._sshTunnel = sshTunnel;
	}

	public abstract connect(): Promise<void>;
	public abstract close(): Promise<void>;

	public abstract getCollections(): Promise<string[]>;

	public abstract describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]>;

	public abstract query<T>(query: string): Promise<T[]>;

	public abstract queryWithDescription<T>(query: string): Promise<IQueryResultWithDescription<T>>;
}
