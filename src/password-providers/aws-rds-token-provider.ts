import AWS from '../services/aws';
import BasePasswordProvider from './base';
import Password from './password';

export interface IAWSRDSTokenPasswordProviderConfig {
	host: string;
	port: number;
	username: string;
	region: string;
	profile: string;
	// TODO maybe access key and secret key instead of profile?
}

export default class AWSRDSTokenPasswordProvider extends BasePasswordProvider<IAWSRDSTokenPasswordProviderConfig> {
	public async getPassword(): Promise<Password> {
		const token = await this._generateAuthToken();
		const params = new URLSearchParams(token);
		const expiresIn = params.get('X-Amz-Expires');
		if (!expiresIn) {
			throw new Error('Failed to get expiration time from AWS RDS token');
		}
		return new Password(token, new Date(Date.now() + parseInt(expiresIn, 10) * 1000));
	}

	private async _generateAuthToken(): Promise<string> {
		return new AWS()
			.command('rds')
			.function('generate-db-auth-token')
			.region(this._config.region)
			.profile(this._config.profile)
			.arg('hostname', this._config.host)
			.arg('port', this._config.port)
			.arg('username', this._config.username)
			.string();
	}
}
