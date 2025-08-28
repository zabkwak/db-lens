import * as vscode from 'vscode';

enum ELevel {
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
}

const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	bold: '\x1b[1m',
};

export interface ILoggingInstance {
	getTag(): string;
}

export default class Logger {
	private static _outputChannel = vscode.window.createOutputChannel('DB Lens');

	public static info(tag: string, message: string): void;
	public static info(instance: ILoggingInstance, message: string): void;
	public static info<T extends object>(tag: string, message: string, data: T): void;
	public static info<T extends object>(instance: ILoggingInstance, message: string, data: T): void;
	public static info<T extends object>(tag: string | ILoggingInstance, message: string, data?: T): void {
		this.log(tag as ILoggingInstance, ELevel.INFO, message, data as T);
	}

	public static warn(tag: string, message: string): void;
	public static warn(instance: ILoggingInstance, message: string): void;
	public static warn<T extends object>(tag: string, message: string, data: T): void;
	public static warn<T extends object>(instance: ILoggingInstance, message: string, data: T): void;
	public static warn<T extends object>(tag: string | ILoggingInstance, message: string, data?: T): void {
		this.log(tag as ILoggingInstance, ELevel.WARN, message, data as T);
	}

	public static error(tag: string, message: string): void;
	public static error(instance: ILoggingInstance, message: string): void;
	public static error<T extends object>(tag: string, message: string, data: T): void;
	public static error<T extends object>(instance: ILoggingInstance, message: string, data: T): void;
	public static error<T extends object>(tag: string | ILoggingInstance, message: string, data?: T): void {
		this.log(tag as ILoggingInstance, ELevel.ERROR, message, data as T);
		// vscode.window.showErrorMessage(`Error in ${tag}: ${message}`);
	}

	public static log(tag: string, level: ELevel, message: string): void;
	public static log(instance: ILoggingInstance, level: ELevel, message: string): void;
	public static log<T extends object>(tag: string, level: ELevel, message: string, data: T): void;
	public static log<T extends object>(instance: ILoggingInstance, level: ELevel, message: string, data: T): void;
	public static log<T extends object>(
		tag: string | ILoggingInstance,
		level: ELevel,
		message: string,
		data?: T,
	): void {
		const tagString = typeof tag === 'string' ? tag : tag.getTag();
		this._writeToOutput(level, `${new Date().toISOString()} [${level}] [${tagString}] ${message}`);
		if (data) {
			const json = JSON.stringify(data, null, 4);
			const indented = json
				.split('\n')
				.map((line) => `\t${line}`)
				.join('\n');
			this._writeToOutput(level, indented);
		}
	}

	private static _writeToOutput(level: ELevel, data: string): void {
		this._outputChannel.appendLine(data);
		// switch (level) {
		// 	case ELevel.INFO:
		// 		this._outputChannel.appendLine(`${colors.blue}${data}${colors.reset}`);
		// 		break;
		// 	case ELevel.WARN:
		// 		this._outputChannel.appendLine(`${colors.yellow}${data}${colors.reset}`);
		// 		break;
		// 	case ELevel.ERROR:
		// 		this._outputChannel.appendLine(`${colors.red}${data}${colors.reset}`);
		// 		break;
		// }
	}
}
