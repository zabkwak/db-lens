import { vscode } from './vscode-api';

export default class Logger {
	public static info(message: string, data?: object): void {
		vscode.postMessage({
			command: 'log',
			payload: {
				level: 'info',
				message,
				data,
			},
		});
	}

	public static warn(message: string, data?: object): void {
		vscode.postMessage({
			command: 'log',
			payload: {
				level: 'warn',
				message,
				data,
			},
		});
	}

	public static error(message: string, data?: object): void {
		vscode.postMessage({
			command: 'log',
			payload: {
				level: 'error',
				message,
				data,
			},
		});
	}
}
