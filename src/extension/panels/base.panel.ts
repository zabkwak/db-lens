import * as vscode from 'vscode';
import { IMessagePayload, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import Logger from '../../logger';
import { showError } from '../utils';

export default abstract class BasePanel {
	protected _context: vscode.ExtensionContext;

	private _panel: vscode.WebviewPanel;

	private _showed: boolean = false;

	constructor(context: vscode.ExtensionContext, title: string, viewType: string) {
		this._context = context;
		this._panel = vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.One, {
			enableScripts: true,
			retainContextWhenHidden: true,
		});
	}

	public show(): void {
		if (this._showed) {
			this._panel.reveal();
		} else {
			this._showed = true;
			this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._context.extensionUri);
			this._panel.webview.onDidReceiveMessage(this._didReceiveMessage, undefined, this._context.subscriptions);
		}
	}

	public postMessage<T extends keyof IMessagePayload>(message: IPostMessage<T>): void {
		Logger.info('extension', 'Sending post message to webview', {
			command: message.command,
		});
		this._panel.webview.postMessage(message);
	}

	protected abstract _handleMessage(message: IPostMessage<any>): Promise<void>;

	protected async _getInitialData(): Promise<object> {
		return {};
	}

	private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
		// Get the URI for the compiled JS file
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', 'assets', 'index.js'),
		);

		// Get the URI for the compiled CSS file
		const stylesUri = webview.asWebviewUri(
			vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', 'assets', 'index.css'),
		);

		return `<!DOCTYPE html>
		  <html lang="en">
			<head>
			  <meta charset="UTF-8">
			  <meta name="viewport" content="width=device-width, initial-scale=1.0">
			  <link rel="stylesheet" type="text/css" href="${stylesUri}">
			  <title>Query Editor</title>
			</head>
			<body>
			  <div id="root"></div>
			  <script type="module" src="${scriptUri}"></script>
			</body>
		  </html>`;
	}

	private _didReceiveMessage = async <T extends keyof IMessagePayload>(message: IPostMessage<T>): Promise<void> => {
		try {
			if (isCommand(message, 'log')) {
				// @ts-expect-error
				Logger.log('webview-ui', message.payload.level, message.payload.message, message.payload.data);
				return;
			}
			if (isCommand(message, 'error')) {
				Logger.error('webview-ui', message.payload.message, { error: message.payload });
				showError(message.payload.message);
				return;
			}
			if (isCommand(message, 'ready')) {
				this.postMessage({
					command: 'navigation',
					payload: {
						route: this._panel.viewType,
						data: await this._getInitialData(),
					},
				});
				return;
			}
			Logger.info('extension', 'Received post message', {
				message,
			});
			await this._handleMessage(message);
		} catch (error: any) {
			Logger.error('extension', `Error handling message: ${error.message}`, {
				message,
				error: {
					message: error.message,
					...error,
				},
			});
			vscode.window.showErrorMessage(`Error handling message: ${error.message}`);
			this._panel.webview.postMessage({ command: 'error', data: error.message });
		}
	};
}
