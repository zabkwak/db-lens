import AWSRDSTokenPasswordProvider, { IAWSRDSTokenPasswordProviderConfig } from './aws-rds-token-provider';
import AWSSSMPasswordProvider, { IAWSSSMTokenPasswordProviderConfig } from './aws-ssm-provider';
import BasePasswordProvider from './base';
import ConfigPasswordProvider, { IConfigPasswordProviderConfig } from './config-provider';
import PromptPasswordProvider from './prompt-provider';

export const passwordProviders: Record<keyof TPasswordProviders, new (config: any) => BasePasswordProvider<any>> = {
	config: ConfigPasswordProvider,
	'aws-rds-token': AWSRDSTokenPasswordProvider,
	'aws-ssm': AWSSSMPasswordProvider,
	prompt: PromptPasswordProvider,
};

export type TPasswordProviders = {
	config: IConfigPasswordProviderConfig;
	'aws-rds-token': IAWSRDSTokenPasswordProviderConfig;
	'aws-ssm': IAWSSSMTokenPasswordProviderConfig;
	prompt: {};
};
