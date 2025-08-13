import BasePasswordProvider from './base';
import Password from './password';

export interface IConfigPasswordProviderConfig {
	password: string;
}

export default class ConfigPasswordProvider extends BasePasswordProvider<IConfigPasswordProviderConfig> {
	public async getPassword(): Promise<Password> {
		return new Password(this._config.password);
	}
}
