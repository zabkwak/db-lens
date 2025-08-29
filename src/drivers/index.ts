import SSHTunnel from '../connection/ssh-tunnel';
import BasePasswordProvider from '../password-providers/base';
import BaseDriver from './base';
import MySqlDriver, { IMysqlCredentials } from './mysql';
import PostgresDriver, { IPostgresCredentials } from './postgres';

export const drivers: Record<
	keyof TCredentials,
	// TODO unify the sshTunnel types, this is just a hack
	new (credentials: any, passwordProvider: BasePasswordProvider<any>, sshTunnel?: SSHTunnel | null) => BaseDriver<
		any,
		any
	>
> = {
	postgres: PostgresDriver,
	mysql: MySqlDriver,
};

export type TCredentials = {
	postgres: IPostgresCredentials;
	mysql: IMysqlCredentials;
};
