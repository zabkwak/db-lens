export interface IFormType {
	text: string;
	checkbox: boolean;
	number: number;
	select: string;
}

export type TFormType = IFormType[keyof IFormType];

export interface IFormDefinition<T extends keyof IFormType = keyof IFormType> {
	key: string;
	label: string;
	type: T;
	placeholder?: string;
	defaultValue?: IFormType[T];
	required?: boolean;
}

export const driverOptions: Record<string, IFormDefinition[]> = {
	postgres: [
		{
			key: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'Enter Host',
			defaultValue: 'localhost',
			required: true,
		},
		{
			key: 'port',
			label: 'Port',
			type: 'number',
			placeholder: 'Enter Port',
			defaultValue: 5432,
			required: true,
		},
		{
			key: 'username',
			label: 'Username',
			type: 'text',
			placeholder: 'Enter Username',
			defaultValue: '',
			required: true,
		},
		{
			key: 'database',
			label: 'Database Name',
			type: 'text',
			placeholder: 'Enter Database Name',
			defaultValue: '',
			required: true,
		},
		{
			key: 'sslRejectUnauthorized',
			label: 'SSL Reject Unauthorized',
			type: 'checkbox',
			defaultValue: true,
		},
		{
			key: 'schema',
			label: 'Schema',
			type: 'text',
			placeholder: 'Enter Schema (optional)',
			defaultValue: 'public',
		},
	],
	mysql: [
		{
			key: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'Enter Host',
			defaultValue: 'localhost',
			required: true,
		},
		{
			key: 'port',
			label: 'Port',
			type: 'number',
			placeholder: 'Enter Port',
			defaultValue: 3306,
			required: true,
		},
		{
			key: 'username',
			label: 'Username',
			type: 'text',
			placeholder: 'Enter Username',
			defaultValue: '',
			required: true,
		},
		{
			key: 'database',
			label: 'Database Name',
			type: 'text',
			placeholder: 'Enter Database Name',
			defaultValue: '',
			required: true,
		},
		{
			key: 'sslRejectUnauthorized',
			label: 'SSL Reject Unauthorized',
			type: 'checkbox',
			defaultValue: true,
		},
	],
};

export const drivers = Object.keys(driverOptions) as (keyof typeof driverOptions)[];

export const passwordProviderOptions: Record<string, IFormDefinition[]> = {
	'aws-rds-token': [
		{
			key: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'Enter database host',
			required: true,
		},
		{
			key: 'port',
			label: 'Port',
			type: 'number',
			placeholder: 'Enter database port',
			required: true,
		},
		{
			key: 'username',
			label: 'Username',
			type: 'text',
			placeholder: 'Enter AWS IAM username',
			required: true,
		},
		{
			key: 'region',
			label: 'Region',
			type: 'text',
			placeholder: 'Enter AWS region',
			required: true,
		},
		{
			key: 'profile',
			label: 'Profile',
			type: 'text',
			placeholder: 'Enter aws profile name',
			required: true,
		},
	],
	'aws-ssm': [
		{
			key: 'name',
			label: 'Name',
			type: 'text',
			placeholder: 'Enter parameter name',
			required: true,
		},
		{
			key: 'region',
			label: 'Region',
			type: 'text',
			placeholder: 'Enter AWS region',
			required: true,
		},
		{
			key: 'profile',
			label: 'Profile',
			type: 'text',
			placeholder: 'Enter aws profile name',
			required: true,
		},
	],
	prompt: [],
};

export const passwordProviders = Object.keys(passwordProviderOptions) as (keyof typeof passwordProviderOptions)[];
