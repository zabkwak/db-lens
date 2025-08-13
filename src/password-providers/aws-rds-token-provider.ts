import { exec } from 'child_process';
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

	private _generateAuthToken(): Promise<string> {
		const command = [
			'aws',
			'rds',
			'generate-db-auth-token',
			'--hostname',
			this._config.host,
			'--port',
			this._config.port,
			'--username',
			this._config.username,
			'--region',
			this._config.region,
			'--profile',
			this._config.profile,
		];
		return new Promise((resolve, reject) => {
			exec(command.join(' '), (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				// TODO handle stderr
				resolve(stdout.trim());
			});
		});
	}
}
