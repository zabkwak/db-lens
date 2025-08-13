import * as vscode from 'vscode';
import { IPostMessage } from '../../shared/types';
import { isCommand } from '../../shared/utils';
import Connection from '../connection/connection';
import ConnectionManager from '../connection/connection-manager';
import Logger from '../logger';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import BasePanel from './base.panel';

export default class ConfigPanel extends BasePanel {
	private _item: ConnectionTreeItem<any, any>;

	constructor(item: ConnectionTreeItem<any, any>, context: vscode.ExtensionContext) {
		super(context, `DB Lens - ${item.label} configuration`, 'db-lens.config');
		this._item = item;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		if (isCommand(message, 'testConnection')) {
			const { payload } = message;
			const connection = await Connection.create(payload.name, {
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
					// @ts-expect-error
					config: payload.db.passwordProvider.options,
				},
			});
			try {
				Logger.info('extension', 'Testing connection');
				await connection.connect();
				await connection.loadCollections();
				Logger.info('extension', 'Connection successful');
				vscode.window.showInformationMessage('Connection successful');
				this.postMessage({
					command: 'testConnectionResult',
					payload: {
						success: true,
					},
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
				});
			} finally {
				await connection.destroy();
			}
			return;
		}
		if (isCommand(message, 'saveConnection')) {
			const { payload } = message;
			Logger.info('extension', 'Saving connection configuration');
			// TODO add data to ConnectionManager -> create new connection or update existing one
			await ConnectionManager.save();
			Logger.info('extension', 'Connection configuration saved');
			return;
		}
	}

	protected async _getInitialData(): Promise<object> {
		return this._item.getConnection().getConfiguration();
	}
}
