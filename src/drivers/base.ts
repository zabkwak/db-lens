import SSHTunnel from '../connection/ssh-tunnel';
import Logger, { ILoggingInstance } from '../logger';
import BasePasswordProvider from '../password-providers/base';
import Password from '../password-providers/password';
import { ICollectionPropertyDescription, IQueryResult } from './interfaces';

export default abstract class BaseDriver<T, U> implements ILoggingInstance {
	protected _credentials: T;

	// TODO handle non-password authentication
	protected _passwordProvider: BasePasswordProvider<U>;

	protected _sshTunnel: SSHTunnel | null = null;

	protected _password: Password | null = null;

	protected _connected: boolean = false;

	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>);
	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>, sshTunnel: SSHTunnel);
	constructor(credentials: T, passwordProvider: BasePasswordProvider<U>, sshTunnel: SSHTunnel | null = null) {
		this._credentials = credentials;
		this._passwordProvider = passwordProvider;
		this._sshTunnel = sshTunnel;
	}

	public async connect(): Promise<void> {
		if (this.isConnected()) {
			return;
		}
		if (this._sshTunnel && !this._sshTunnel.isOpen()) {
			throw new Error('SSH tunnel is not open');
		}
		try {
			this._password = await this._passwordProvider.getPassword();
			await this._connect();
			this._connected = true;
			Logger.info(this, `Connected to ${this.getName()}`);
		} catch (error: any) {
			const message = error.message || error.code || 'Unknown error';
			Logger.error(this, `Error connecting to ${this.getName()}: ${message}`, {
				error: {
					message,
					...error,
				},
			});
			throw new Error(message);
		}
	}

	public async reconnect(): Promise<void> {
		if (!this.isConnected()) {
			throw new Error('Database not connected');
		}
		await this._close();
		this._connected = false;
		Logger.info(this, `Reconnecting to ${this.getName()}`);
		await this._connect();
		this._connected = true;
	}

	public async close(): Promise<void> {
		await this._close();
		this._password = null;
		this._connected = false;
		Logger.info(this, 'Connection closed');
	}

	public abstract getCollections(): Promise<string[]>;

	public abstract describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]>;

	public abstract query<T>(query: string): Promise<IQueryResult<T>>;

	public isConnected(): boolean {
		return this._connected;
	}

	public abstract getTag(): string;

	public abstract getName(): string;

	protected abstract _connect(): Promise<void>;

	protected abstract _close(): Promise<void>;
}
