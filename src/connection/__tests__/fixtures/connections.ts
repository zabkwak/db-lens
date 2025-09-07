import { IConnection, IConnectionGroup } from '../../connection';

export const connection1 = {
	name: 'Test Connection',
	db: {
		driver: 'postgres',
		credentials: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			database: 'postgres',
			schema: 'public',
			sslRejectUnauthorized: false,
		},
	},
	passwordProvider: {
		type: 'aws-rds-token',
		config: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			region: 'us-east-1',
			profile: 'some-profile',
		},
	},
	sshTunnelOptions: {
		host: 'bastion',
		port: 22,
		username: 'ec2-user',
		privateKey: '/path/to/private/key',
		passphrase: null,
		localPort: 5432,
		localHost: 'localhost',
		connectionTimeout: 10000,
	},
} as IConnection<any, any>;

export const newConnection1 = {
	name: 'Another connection',
	db: {
		driver: 'postgres',
		credentials: {
			host: 'another.host',
			port: 3306,
			username: 'another.user',
			database: 'mysql',
			schema: 'public',
			sslRejectUnauthorized: false,
		},
	},
	passwordProvider: {
		type: 'aws-rds-token',
		config: {
			host: 'another.host',
			port: 3306,
			username: 'another.user',
			region: 'us-west-2',
			profile: 'another-profile',
		},
	},
	sshTunnelOptions: {
		host: 'bastion',
		port: 22,
		username: 'ec2-user',
		privateKey: '/path/to/private/key',
		passphrase: null,
		localPort: 3306,
		localHost: 'localhost',
		connectionTimeout: 10000,
	},
} as IConnection<any, any>;

export const updatedConnection1 = {
	name: 'Test Connection',
	db: {
		driver: 'postgres',
		credentials: {
			host: 'some.host',
			port: 5433,
			username: 'some.user',
			database: 'postgres',
			schema: 'public',
			sslRejectUnauthorized: false,
		},
	},
	passwordProvider: {
		type: 'aws-rds-token',
		config: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			region: 'us-east-1',
			profile: 'some-profile',
		},
	},
	sshTunnelOptions: {
		host: 'bastion',
		port: 22,
		username: 'ec2-user',
		privateKey: '/path/to/private/key',
		passphrase: null,
		localPort: 5432,
		localHost: 'localhost',
		connectionTimeout: 10000,
	},
} as IConnection<any, any>;

export const nestedConnection1 = {
	name: 'Nested connection',
	db: {
		driver: 'postgres',
		credentials: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			database: 'postgres',
			schema: 'public',
			sslRejectUnauthorized: false,
		},
	},
	passwordProvider: {
		type: 'aws-rds-token',
		config: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			region: 'us-east-1',
			profile: 'some-profile',
		},
	},
	sshTunnelOptions: {
		host: 'bastion',
		port: 22,
		username: 'ec2-user',
		privateKey: '/path/to/private/key',
		passphrase: null,
		localPort: 5432,
		localHost: 'localhost',
		connectionTimeout: 10000,
	},
} as IConnection<any, any>;

export const updatedNestedConnection1 = {
	name: 'Nested connection',
	db: {
		driver: 'postgres',
		credentials: {
			host: 'some.host',
			port: 5433,
			username: 'some.user',
			database: 'postgres',
			schema: 'public',
			sslRejectUnauthorized: false,
		},
	},
	passwordProvider: {
		type: 'aws-rds-token',
		config: {
			host: 'some.host',
			port: 5432,
			username: 'some.user',
			region: 'us-east-1',
			profile: 'some-profile',
		},
	},
	sshTunnelOptions: {
		host: 'bastion',
		port: 22,
		username: 'ec2-user',
		privateKey: '/path/to/private/key',
		passphrase: null,
		localPort: 5432,
		localHost: 'localhost',
		connectionTimeout: 10000,
	},
} as IConnection<any, any>;

export const group1 = {
	name: 'Group',
	connections: [nestedConnection1],
} as IConnectionGroup;
