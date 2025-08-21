import { IMessagePayload, IPostMessage } from '../../shared/types';

export interface IVsCodeApi {
	postMessage<T extends keyof IMessagePayload>(message: IPostMessage<T>): void;
}

declare const acquireVsCodeApi: () => IVsCodeApi;

export const vscode =
	typeof acquireVsCodeApi === 'function'
		? acquireVsCodeApi()
		: {
				postMessage: async <T extends keyof IMessagePayload>(message: IPostMessage<T>) => {
					console.log('Message to VS Code:', message);
					await sleep(500);
					if (message.command === 'ready') {
						const params = new URLSearchParams(window.location.search);
						window.postMessage({
							command: 'navigation',
							payload: {
								route: params.get('route'),
								data: {
									name: 'Test Connection',
								},
							},
						});
						return;
					}
					if (message.command === 'query') {
						window.postMessage({
							command: 'query.result',
							payload: {
								success: true,
								data: {
									data: [
										{
											id: 'account-1',
											name: 'Account 1',
											'column-1': 'Some longer string to wrap the fucking lines',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
										{
											id: 'account-1',
											name: 'Account something something 1',
											'column-1': 'Something',
										},
									],
									columns: [
										{
											name: 'id',
										},
										{
											name: 'name',
										},
										{
											name: 'column-1',
										},
										{
											name: 'column-2',
										},
										{
											name: 'column-3',
										},
										{
											name: 'column-4',
										},
										{
											name: 'column-5',
										},
										{
											name: 'column-6',
										},
										{
											name: 'column-7',
										},
										{
											name: 'column-8',
										},
										{
											name: 'column-9',
										},
										{
											name: 'column-10',
										},
										{
											name: 'column-11',
										},
										{
											name: 'column-12',
										},
										{
											name: 'column-13',
										},
										{
											name: 'column-14',
										},
										{
											name: 'column-15',
										},
										{
											name: 'column-16',
										},
										{
											name: 'column-17',
										},
										{
											name: 'column-18',
										},
										{
											name: 'column-19',
										},
										{
											name: 'column-20',
										},
									],
								},
							},
							requestId: 'test',
						});
						return;
					}
				},
		  };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
