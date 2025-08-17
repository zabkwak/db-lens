import os from 'os';
import * as vscode from 'vscode';

export default class Config {
	public static getBaseDir(): string {
		return this.getConfiguration().get<string>('baseDir') || os.homedir();
	}

	public static getPortRange(): [number, number] {
		const portRange = this.getConfiguration().get<[number, number]>('portRange');
		if (!portRange || portRange.length !== 2) {
			return [49152, 65535];
		}
		return portRange;
	}

	public static getConfiguration(): vscode.WorkspaceConfiguration {
		// TODO for some reason putting this to private property breaks sinon mocks
		return vscode.workspace.getConfiguration('db-lens');
	}
}
