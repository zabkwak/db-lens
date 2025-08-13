import AWSRDSTokenPasswordProvider, { IAWSRDSTokenPasswordProviderConfig } from './aws-rds-token-provider';
import BasePasswordProvider from './base';
import ConfigPasswordProvider, { IConfigPasswordProviderConfig } from './config-provider';

export const passwordProviders: Record<keyof TPasswordProviders, new (config: any) => BasePasswordProvider<any>> = {
	config: ConfigPasswordProvider,
	'aws-rds-token': AWSRDSTokenPasswordProvider,
};

export type TPasswordProviders = {
	config: IConfigPasswordProviderConfig;
	'aws-rds-token': IAWSRDSTokenPasswordProviderConfig;
};
