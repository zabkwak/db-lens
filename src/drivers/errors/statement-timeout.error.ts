import BaseError from '../../error';

export default class StatementTimeoutError extends BaseError {
	constructor(message: string) {
		super(message, 'ERR_STATEMENT_TIMEOUT');
	}
}
