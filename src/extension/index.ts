// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import Connection from '../connection/connection';
import ConnectionManager from '../connection/connection-manager';
import ConfigPanel from './panels/config.panel';
import QueryPanel from './panels/query.panel';
import SqlCopyCodeLensProvider from './providers/sql-copy-code-lens-provider';
import ConnectionTreeItem from './providers/tree-items/connection.tree-item';
import NamespaceTreeItem from './providers/tree-items/namespace.tree-item';
import { confirmWarningDialog } from './utils';
import ViewManager from './view-manager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		// Providers
		vscode.window.registerTreeDataProvider('dbLensSidebar', ViewManager.getConnectionTreeProvider()),
		// TODO move to ViewManager? it's not basically a view
		vscode.languages.registerCodeLensProvider({ language: 'sql' }, new SqlCopyCodeLensProvider()),
		// Commands
		vscode.commands.registerCommand('db-lens.connect', async (item: ConnectionTreeItem<any, any>) => {
			await ViewManager.getConnectionTreeProvider().connect(item);
		}),
		vscode.commands.registerCommand('db-lens.query', (item: ConnectionTreeItem<any, any> | NamespaceTreeItem) => {
			new QueryPanel(
				item.getConnection(),
				context,
				item instanceof NamespaceTreeItem ? item.getName() : null,
			).show();
		}),
		vscode.commands.registerCommand('db-lens.configure', (item: ConnectionTreeItem<any, any>) => {
			new ConfigPanel(context, item).show();
		}),
		vscode.commands.registerCommand('db-lens.disconnect', async (item: ConnectionTreeItem<any, any>) => {
			await ViewManager.getConnectionTreeProvider().disconnect(item);
		}),
		vscode.commands.registerCommand('db-lens.addConnection', async () => {
			new ConfigPanel(context).show();
		}),
		vscode.commands.registerCommand('db-lens.removeConnection', async (item: ConnectionTreeItem<any, any>) => {
			if (await confirmWarningDialog('Are you sure you want to delete this connection?', 'Delete')) {
				await ConnectionManager.deleteConnection(item.getConnection());
				ViewManager.getConnectionTreeProvider().refresh();
			}
		}),
		vscode.commands.registerCommand('db-lens.copyValue', async (args: any) => {
			const { value } = args;
			if (value) {
				await vscode.env.clipboard.writeText(value);
				vscode.window.showInformationMessage('Value copied to clipboard');
			}
		}),
		vscode.commands.registerCommand('db-lens.viewRowAsJSON', async (args: any) => {
			const { row } = args;
			if (row) {
				const document = await vscode.workspace.openTextDocument({
					content: JSON.stringify(row, null, 4),
					language: 'json',
				});
				await vscode.window.showTextDocument(document, { preview: true });
			}
		}),
	);

	// TODO delete
	const disposable = vscode.commands.registerCommand('db-lens.helloWorld', async () => {
		vscode.window.showInformationMessage('Hello World from db-lens!');
		const document = await vscode.workspace.openTextDocument({ content: 'select * from user', language: 'sql' });
		await vscode.window.showTextDocument(document, { preview: true });
	});
	context.subscriptions.push(disposable);

	const openNewTabCommand = vscode.commands.registerCommand('db-lens.openNewTab', async () => {
		const document = await vscode.workspace.openTextDocument({ content: '<h1>test</h1>', language: 'html' });
		await vscode.window.showTextDocument(document, { preview: true });
	});
	context.subscriptions.push(openNewTabCommand);

	context.subscriptions.push({
		dispose: async () => {
			await Connection.cleanup();
		},
	});
}

// This method is called when your extension is deactivated
export async function deactivate() {
	await Connection.cleanup();
}
