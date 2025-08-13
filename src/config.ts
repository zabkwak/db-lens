import os from 'os';
import * as vscode from 'vscode';

export default class Config {
	public static getBaseDir(): string {
		return this.getConfiguration().get<string>('baseDir') || os.homedir();
	}

	public static getConfiguration(): vscode.WorkspaceConfiguration {
		// TODO for some reason putting this to private property breaks sinon mocks
		return vscode.workspace.getConfiguration('db-lens');
	}
}
