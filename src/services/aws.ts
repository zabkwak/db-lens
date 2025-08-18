import { exec } from 'child_process';
import PromiseChain from '../utils/promise-chain';

interface IAttribute {
	name: string;
	value?: string | number;
}

export default class AWS<T extends string | object> extends PromiseChain<T> {
	private _command: string | null = null;

	private _function: string | null = null;

	private _region: string | null = null;

	private _profile: string | null = null;

	private _args: IAttribute[] = [];

	private _parseJSON: boolean = false;

	public command(command: string): this {
		this._command = command;
		return this;
	}

	public function(fn: string): this {
		this._function = fn;
		return this;
	}

	public region(region: string): this {
		this._region = region;
		return this;
	}

	public profile(profile: string): this {
		this._profile = profile;
		return this;
	}

	public arg(name: string): this;
	public arg(name: string, value: string): this;
	public arg(name: string, value: number): this;
	public arg(name: string, value?: string | number): this {
		this._args.push({ name, value });
		return this;
	}

	public string(): AWS<string> {
		this._parseJSON = false;
		return this as unknown as AWS<string>;
	}

	public json(): AWS<T> {
		this._parseJSON = true;
		return this as unknown as AWS<T>;
	}

	protected execute(): Promise<T> {
		return new Promise((resolve, reject) => {
			if (!this._command) {
				reject(new Error('Command is not set'));
				return;
			}
			if (!this._function) {
				reject(new Error('Function is not set'));
				return;
			}
			if (!this._region) {
				reject(new Error('Region is not set'));
				return;
			}
			if (!this._profile) {
				reject(new Error('Profile is not set'));
				return;
			}
			const cmd = [
				'aws',
				this._command,
				this._function,
				'--region',
				this._region,
				'--profile',
				this._profile,
				...this._args
					.map(({ name, value }) => [`--${name}`, value])
					.flat()
					.filter(Boolean),
			];
			exec(cmd.join(' '), (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				// TODO handle stderr
				if (!this._parseJSON) {
					resolve(stdout.trim() as T);
					return;
				}
				try {
					resolve(JSON.parse(stdout.trim()));
				} catch (error) {
					reject(error);
				}
			});
		});
	}
}
