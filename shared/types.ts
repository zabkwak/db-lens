export interface IPostMessage<T extends keyof IMessagePayload> {
	command: T;
	payload: IMessagePayload[T];
	requestId?: string;
}

export interface IResult<T> {
	success: boolean;
	error?: {
		message: string;
	};
	data?: T;
}

export enum EQueryCommand {
	UPDATE = 'update',
	SELECT = 'select',
	INSERT = 'insert',
	DELETE = 'delete',
}

export interface IMessagePayload {
	query: {
		query: string;
	};
	'query.result': IResult<{
		data: any[];
		columns: IColumn[];
		rowCount: number | null;
		command: EQueryCommand;
	}>;
	log: {
		level: 'info' | 'warn' | 'error';
		message: string;
		data?: object;
	};
	navigation: {
		route: string;
		data: object;
	};
	ready: null;
	testConnection: IConnectionConfiguration;
	testConnectionResult: {
		success: boolean;
		message?: string;
	};
	saveConnection: IConnectionConfiguration;
	saveConnectionResult: {
		success: boolean;
		message?: string;
	};
	error: {
		message: string;
	};
}

export interface IColumn {
	name: string;
}

export interface ISSHTunnelConfiguration {
	/**
	 * The SSH host to connect to.
	 * @default "localhost"
	 */
	host: string;
	/**
	 * The SSH port to connect to.
	 * @default 22
	 */
	port: number;
	/**
	 * The SSH username to use for the connection. If not provided, it will use the current user's username.
	 * @default os.userInfo().username
	 */
	username: string;
	/**
	 * Absolute path to the private key file.
	 */
	privateKey: string;
	/**
	 * The passphrase for the private key, if required.
	 * @default null
	 */
	passphrase: string | null;
	/**
	 * The local port to forward.
	 * @default 8080
	 */
	localPort: number;
	/**
	 * The local host to bind the port to.
	 * @default "localhost"
	 */
	localHost: string;
	/**
	 * The timeout for the SSH connection in milliseconds.
	 * @default 10000
	 */
	connectionTimeout: number;
}

export interface IConnectionConfiguration {
	name: string;
	sshTunnelOptions?: Partial<ISSHTunnelConfiguration>;
	db: {
		driver: string;
		credentials: Record<string, any>;
		passwordProvider: {
			name: string;
			options: Record<string, any>;
		};
	};
}
