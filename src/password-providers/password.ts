export default class Password {
	public readonly password: string;
	private _expiresAt: Date | null;

	constructor(password: string);
	constructor(password: string, expiresAt: Date);
	constructor(password: string, expiresAt: Date | null = null) {
		this.password = password;
		this._expiresAt = expiresAt;
	}

	public isExpired(): boolean {
		if (!this._expiresAt) {
			return false;
		}
		return new Date() > this._expiresAt;
	}
}
