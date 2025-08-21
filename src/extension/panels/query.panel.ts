import * as vscode from 'vscode';
import { EQueryCommand, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import { showError, showInfo } from '../utils';
import BasePanel from './base.panel';

export default class QueryPanel extends BasePanel {
	private _item: ConnectionTreeItem<any, any>;

	constructor(item: ConnectionTreeItem<any, any>, context: vscode.ExtensionContext) {
		super(context, `DB Lens - ${item.label}`, 'db-lens.queryEditor');
		this._item = item;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		if (isCommand(message, 'query')) {
			const { payload, requestId } = message;
			try {
				const { data, properties, rowCount, command } = await this._item
					.getConnection()
					.getDriver()
					.query(payload.query);
				this.postMessage({
					command: 'query.result',
					payload: { success: true, data: { data, columns: properties, rowCount, command } },
					requestId,
				});
				if (command !== EQueryCommand.SELECT) {
					showInfo(`Changed ${rowCount} rows`);
				}
			} catch (error: any) {
				showError(error.message);
				this.postMessage({
					command: 'query.result',
					payload: { success: false, error: { message: error.message } },
					requestId,
				});
			}
			return;
		}
	}
}
