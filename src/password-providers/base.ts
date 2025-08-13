import Password from './password';

export default abstract class BasePasswordProvider<T> {
	protected _config: T;
	constructor(config: T) {
		this._config = config;
	}

	public abstract getPassword(): Promise<Password>;

	public getConfig(): T {
		return this._config;
	}
}
