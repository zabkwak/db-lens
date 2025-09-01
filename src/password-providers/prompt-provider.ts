import * as vscode from 'vscode';
import BasePasswordProvider from './base';
import Password from './password';

export default class PromptPasswordProvider extends BasePasswordProvider<{}> {
	constructor() {
		super({});
	}

	public async getPassword(): Promise<Password> {
		const password = await vscode.window.showInputBox({
			prompt: 'Please enter your password',
			placeHolder: 'Password',
			password: true,
			ignoreFocusOut: true,
		});
		if (!password) {
			throw new Error('Password is required');
		}
		return new Password(password);
	}
}
