import * as vscode from 'vscode';

export async function confirmWarningDialog(message: string, confirmAction: string): Promise<boolean> {
	const result = await vscode.window.showWarningMessage(message, { modal: true }, confirmAction);
	return result === confirmAction;
}
