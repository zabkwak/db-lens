import * as uuid from 'uuid';
import { IMessagePayload, IPostMessage } from '../../shared/types';
import { vscode } from './vscode-api';

type TResolve = (message: IPostMessage<keyof IMessagePayload>) => void;

export default class Request {
	private static _requests: Map<string, TResolve> = new Map();

	public static handleMessage(message: IPostMessage<keyof IMessagePayload>): void {
		if (!message.requestId) {
			return;
		}
		const resolve = this._requests.get(message.requestId);
		if (!resolve) {
			return;
		}
		resolve(message);
	}

	public static async request<T extends keyof IMessagePayload, U extends keyof IMessagePayload>(
		command: T,
		payload: IMessagePayload[T],
		timeout: number = 5000,
	): Promise<IMessagePayload[U]> {
		const requestId = uuid.v7();
		vscode.postMessage({
			command,
			payload,
			requestId,
		});
		// TODO handle response command?
		return new Promise((resolve, reject) => {
			let timedOut = false;
			const t = setTimeout(() => {
				timedOut = true;
				Request._requests.delete(requestId);
				reject(new Error('Request timed out'));
			}, timeout);
			Request._requests.set(requestId, (message) => {
				Request._requests.delete(requestId);
				if (timedOut) {
					return;
				}
				clearTimeout(t);
				resolve(message.payload as IMessagePayload[U]);
			});
		});
	}
}
