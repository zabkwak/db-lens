import * as vscode from 'vscode';

export default class SqlCopyCodeLensProvider implements vscode.CodeLensProvider {
	public provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		if (document.languageId !== 'sql') {
			return [];
		}

		const range = new vscode.Range(0, 0, 0, 0);

		const codeLens = new vscode.CodeLens(range);

		return [codeLens];
	}

	public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
		codeLens.command = {
			title: 'Copy SQL to DB Lens',
			command: 'db-lens.copyToQueryView',
			tooltip: 'Copies the entire file content to the first DB Lens window',
		};
		return codeLens;
	}
}
