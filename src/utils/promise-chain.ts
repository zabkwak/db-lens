import assert from 'node:assert';

export default abstract class PromiseChain<T> {
	private _promise: Promise<T>;
	private _resolve: ((value: T) => void) | undefined;
	private _reject: ((reason?: any) => void) | undefined;

	constructor() {
		this._promise = new Promise<T>((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	public async then<TResult1 = T, TResult2 = never>(
		onFulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
		onRejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
	): Promise<TResult1 | TResult2> {
		await this._execute();
		return this._promise.then(onFulfilled, onRejected);
	}

	public async catch<TResult = never>(
		onRejected?: (reason: any) => TResult | PromiseLike<TResult>,
	): Promise<T | TResult> {
		await this._execute();
		return this._promise.catch(onRejected);
	}

	public async finally(onFinally?: () => void): Promise<T> {
		await this._execute();
		return this._promise.finally(onFinally);
	}

	protected abstract execute(): Promise<T>;

	private async _execute(): Promise<void> {
		assert(this._resolve, 'resolver must be defined');
		assert(this._reject, 'rejector must be defined');
		try {
			this._resolve(await this.execute());
		} catch (error) {
			this._reject(error);
		}
	}
}
