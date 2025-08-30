export default class BaseError extends Error {
	public code: `ERR_${string}`;

	constructor(message: string);
	constructor(message: string, code: `ERR_${Uppercase<string>}`);
	constructor(message: string, code?: `ERR_${Uppercase<string>}`) {
		super(message);
		this.code = code || 'ERR_UNKNOWN';
	}

	public toJSON(): Record<string, any> {
		return {
			message: this.message,
			code: this.code,
		};
	}

	public toString(): string {
		return `[${this.code}] ${this.message}`;
	}
}
