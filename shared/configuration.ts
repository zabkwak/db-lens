export interface IFormType {
	text: string;
	checkbox: boolean;
	number: number;
	select: string;
}

export interface IFormDefinition<T extends keyof IFormType = keyof IFormType> {
	key: string;
	label: string;
	type: T;
	placeholder?: string;
	defaultValue?: IFormType[T];
}

export const drivers: (keyof typeof driverOptions)[] = ['postgres', 'mysql', 'sqlite'];

export const driverOptions: Record<string, IFormDefinition[]> = {
	postgres: [
		{
			key: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'Enter Host',
			defaultValue: 'localhost',
		},
		{
			key: 'port',
			label: 'Port',
			type: 'number',
			placeholder: 'Enter Port',
			defaultValue: 5432,
		},
		{
			key: 'username',
			label: 'Username',
			type: 'text',
			placeholder: 'Enter Username',
			defaultValue: '',
		},
		{
			key: 'database',
			label: 'Database Name',
			type: 'text',
			placeholder: 'Enter Database Name',
			defaultValue: '',
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
	mysql: [],
	sqlite: [],
};

export const passwordProviders: (keyof typeof passwordProviderOptions)[] = ['aws-rds-token'];

export const passwordProviderOptions: Record<string, IFormDefinition[]> = {
	'aws-rds-token': [
		{
			key: 'host',
			label: 'Host',
			type: 'text',
			placeholder: 'Enter database host',
		},
		{
			key: 'port',
			label: 'Port',
			type: 'number',
			placeholder: 'Enter database port',
		},
		{
			key: 'username',
			label: 'Username',
			type: 'text',
			placeholder: 'Enter AWS IAM username',
		},
		{
			key: 'region',
			label: 'Region',
			type: 'text',
			placeholder: 'Enter AWS region',
		},
		{
			key: 'profile',
			label: 'Profile',
			type: 'text',
			placeholder: 'Enter aws profile name',
		},
	],
};
