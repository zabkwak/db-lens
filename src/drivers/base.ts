import SSHTunnel from '../connection/ssh-tunnel';
import BasePasswordProvider from '../password-providers/base';
import { ICollectionPropertyDescription, IQueryResult } from './interfaces';

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

	public abstract query<T>(query: string): Promise<IQueryResult<T>>;

	public abstract isConnected(): boolean;
}
