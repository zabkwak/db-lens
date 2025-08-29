import { IConnectionConfiguration, ISSHTunnelConfiguration } from '../../shared/types';
import { drivers, TCredentials } from '../drivers';
import BaseDriver from '../drivers/base';
import { passwordProviders, TPasswordProviders } from '../password-providers';
import SSHTunnel from './ssh-tunnel';

export interface IConnection<T extends keyof typeof drivers, U extends keyof typeof passwordProviders> {
	sshTunnelOptions?: Partial<ISSHTunnelConfiguration>;
	db: {
		driver: T;
		credentials: TCredentials[T];
	};
	passwordProvider: {
		type: U;
		config: TPasswordProviders[U];
	};
}

export enum EState {
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
	FAILED = 'failed',
}

export default class Connection<T extends keyof typeof drivers, U extends keyof typeof passwordProviders> {
	private static _connections: Connection<any, any>[] = [];

	public static async cleanup(): Promise<void> {
		for (const c of Connection._connections) {
			await c.close();
		}
	}

	private _name: string;
	private _connection: IConnection<T, U>;
	private _sshTunnel: SSHTunnel | null = null;
	private _driver: BaseDriver<unknown, unknown>;
	private _state: EState = EState.DISCONNECTED;
	private _collections: string[] | null = null;

	constructor(name: string, connection: IConnection<T, U>) {
		// TODO validate all credentials
		this._name = name;
		this._connection = connection;
		if (!(connection.db.driver in drivers)) {
			throw new Error(`Unsupported database driver: ${connection.db.driver}`);
		}
		const Driver = drivers[connection.db.driver];
		if (!(connection.passwordProvider.type in passwordProviders)) {
			throw new Error(`Unsupported password provider: ${connection.passwordProvider.type}`);
		}
		const PasswordProvider = passwordProviders[connection.passwordProvider.type];
		if (connection.sshTunnelOptions) {
			this._sshTunnel = new SSHTunnel({
				...connection.sshTunnelOptions,
				remoteHost: connection.db.credentials.host,
				remotePort: connection.db.credentials.port,
			});
			this._driver = new Driver(
				{
					...connection.db.credentials,
					host: null,
					port: null,
				},
				new PasswordProvider(connection.passwordProvider.config),
				this._sshTunnel,
			);
		} else {
			this._driver = new Driver(
				connection.db.credentials,
				new PasswordProvider(connection.passwordProvider.config),
			);
		}
		Connection._connections.push(this);
	}

	public async connect(): Promise<void> {
		this._state = EState.CONNECTING;
		await this._sshTunnel?.open();
		await this._driver.connect();
		this._state = EState.CONNECTED;
	}

	public async destroy(): Promise<void> {
		await this.close();
		const index = Connection._connections.indexOf(this);
		if (index !== -1) {
			Connection._connections.splice(index, 1);
		}
	}

	public close(): Promise<void>;
	public close(failure: boolean): Promise<void>;
	public async close(failure: boolean = false): Promise<void> {
		this._state = failure ? EState.FAILED : EState.DISCONNECTED;
		await this._sshTunnel?.close();
		await this._driver.close();
	}

	public async loadCollections(): Promise<void> {
		this._collections = await this._driver.getCollections();
	}

	public isConnected(): boolean {
		return this._state === EState.CONNECTED;
	}

	public isConnecting(): boolean {
		return this._state === EState.CONNECTING;
	}

	public failed(): boolean {
		return this._state === EState.FAILED;
	}

	public hasCollections(): boolean {
		return this._collections !== null;
	}

	public getName(): string {
		return this._name;
	}

	public getCollections(): string[] {
		return this._collections || [];
	}

	public getDriver(): BaseDriver<unknown, unknown> {
		return this._driver;
	}

	// TODO check differences between getConnection and getConfiguration
	public getConnection(): IConnection<T, U> {
		return this._connection;
	}

	public getConfiguration(): IConnectionConfiguration {
		return {
			name: this._name,
			sshTunnelOptions: this._sshTunnel?.getConfig(),
			db: {
				driver: this._connection.db.driver,
				credentials: this._connection.db.credentials,
				passwordProvider: {
					name: this._connection.passwordProvider.type,
					options: this._connection.passwordProvider.config,
				},
			},
		};
	}
}
