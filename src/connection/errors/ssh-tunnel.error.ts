export enum ECode {
	PERMISSION_DENIED = 'permission-denied',
	CONNECTION_REFUSED = 'connection-refused',
	CONNECTION_TIMEOUT = 'connection-timeout',
	UNKNOWN_ERROR = 'unknown-error',
}

export default class SSHTunnelError extends Error {
	public code: ECode;

	constructor(message: string);
	constructor(message: string, code: ECode);
	constructor(message: string, code?: ECode) {
		super(message);
		this.name = 'SSHTunnelError';
		this.code = code || this._constructCode();
	}

	public toJSON(): Record<string, any> {
		return {
			message: this.message,
			code: this.code,
		};
	}

	private _constructCode(): ECode {
		if (this.message.includes('Permission denied')) {
			return ECode.PERMISSION_DENIED;
		}
		if (this.message.includes('Connection timed out')) {
			return ECode.CONNECTION_TIMEOUT;
		}
		return ECode.UNKNOWN_ERROR;
	}
}
