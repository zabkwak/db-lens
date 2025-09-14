import * as vscode from 'vscode';
import { IConnectionConfiguration, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import Connection from '../../connection/connection';
import ConnectionManager from '../../connection/connection-manager';
import Logger from '../../logger';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import { confirmWarningDialog } from '../utils';
import ViewManager from '../view-manager';
import BasePanel from './base.panel';

export default class ConfigPanel extends BasePanel {
	private _item: ConnectionTreeItem<any, any> | null;
	private _connection: Connection<any, any> | null;

	constructor(context: vscode.ExtensionContext);
	constructor(context: vscode.ExtensionContext, item: ConnectionTreeItem<any, any>);
	constructor(context: vscode.ExtensionContext, item: ConnectionTreeItem<any, any> | null = null) {
		super(context, `DB Lens - ${item?.label || 'Add new'} configuration`, 'db-lens.config');
		this._item = item;
		this._connection = item?.getConnection() || null;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		if (isCommand(message, 'testConnection')) {
			const { payload, requestId } = message;
			const connection = this._constructConnection(payload);
			try {
				Logger.info('extension', 'Testing connection');
				await connection.connect();
				await connection.getDriver().getNamespaces();
				Logger.info('extension', 'Connection successful');
				vscode.window.showInformationMessage('Connection successful');
				this.postMessage({
					command: 'testConnectionResult',
					payload: {
						success: true,
					},
					requestId,
				});
			} catch (error: any) {
				const message = error instanceof Error ? error.message : String(error);
				Logger.error('extension', 'Failed to connect', {
					error: {
						message,
						stack: error?.stack,
					},
				});
				vscode.window.showErrorMessage(`Failed to connect: ${message}`);
				this.postMessage({
					command: 'testConnectionResult',
					payload: {
						success: false,
						message,
					},
					requestId,
				});
			} finally {
				await connection.destroy();
			}
			return;
		}
		if (isCommand(message, 'saveConnection')) {
			const { payload, requestId } = message;
			Logger.info('extension', 'Saving connection configuration');
			try {
				if (!this._connection) {
					this._connection = this._constructConnection(payload);
					await ConnectionManager.addConnection(this._connection);
					ViewManager.getConnectionTreeProvider().refresh();
				} else {
					this._connection = this._constructConnection(payload);
					if (
						!(await confirmWarningDialog(
							'Are you sure you want to update the existing connection?',
							'Update',
						))
					) {
						this.postMessage({
							command: 'saveConnectionResult',
							payload: {
								success: false,
								message: 'Save canceled by user.',
							},
							requestId,
						});
						return;
					}
					await ConnectionManager.updateConnection(this._connection);
					// TODO manage the re-save during creation
					this._item
						? ViewManager.getConnectionTreeProvider().refresh(this._item)
						: ViewManager.getConnectionTreeProvider().refresh();
				}
				Logger.info('extension', 'Connection configuration saved');
				vscode.window.showInformationMessage('Connection configuration saved successfully');
				this.postMessage({
					command: 'saveConnectionResult',
					payload: {
						success: true,
					},
					requestId,
				});
			} catch (error: any) {
				const message = error instanceof Error ? error.message : String(error);
				Logger.error('extension', 'Failed to save connection configuration', {
					error: {
						message,
						stack: error?.stack,
					},
				});
				vscode.window.showErrorMessage(`Failed to save connection configuration: ${message}`);
				this.postMessage({
					command: 'saveConnectionResult',
					payload: {
						success: false,
						message,
					},
					requestId,
				});
			}
			return;
		}
	}

	protected async _getInitialData(): Promise<object> {
		if (!this._item) {
			return {};
		}
		return this._item.getConnection().getConfiguration();
	}

	private _constructConnection(payload: IConnectionConfiguration): Connection<any, any> {
		return new Connection({
			name: payload.name,
			sshTunnelOptions: payload.sshTunnelOptions,
			db: {
				// @ts-expect-error
				driver: payload.db.driver,
				// @ts-expect-error
				credentials: payload.db.credentials,
			},
			passwordProvider: {
				// @ts-expect-error
				type: payload.db.passwordProvider.name,
				config: payload.db.passwordProvider.options,
			},
		});
	}
}
