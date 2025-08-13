import BasePasswordProvider from '../password-providers/base';
import BaseDriver from './base';
import PostgresDriver, { IPostgresCredentials } from './postgres';

export const drivers: Record<
	keyof TCredentials,
	new (credentials: any, passwordProvider: BasePasswordProvider<any>) => BaseDriver<any, any>
> = {
	postgres: PostgresDriver,
};

export type TCredentials = {
	postgres: IPostgresCredentials;
};
