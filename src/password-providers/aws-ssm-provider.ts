import { awsCommand } from '../services/aws';
import BasePasswordProvider from './base';
import Password from './password';

export interface IAWSSSMTokenPasswordProviderConfig {
	name: string;
	region: string;
	profile: string;
	// TODO maybe access key and secret key instead of profile?
}

interface Response {
	Parameter: IParameter;
}

interface IParameter {
	Name: string;
	Value: string;
}

export default class AWSSSMPasswordProvider extends BasePasswordProvider<IAWSSSMTokenPasswordProviderConfig> {
	public async getPassword(): Promise<Password> {
		const parameter = await this._getParameter();
		return new Password(parameter.Value);
	}

	private async _getParameter(): Promise<IParameter> {
		const r: Response = await awsCommand(
			'ssm',
			'get-parameter',
			this._config.region,
			this._config.profile,
			[
				{
					name: 'name',
					value: this._config.name,
				},
				{ name: 'with-decryption' },
			],
			true,
		);
		return r.Parameter;
	}
}
