import * as vscode from 'vscode';
import { IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import { showError } from '../utils';
import BasePanel from './base.panel';

export default class QueryPanel extends BasePanel {
	private _item: ConnectionTreeItem<any, any>;

	constructor(item: ConnectionTreeItem<any, any>, context: vscode.ExtensionContext) {
		super(context, `DB Lens - ${item.label}`, 'db-lens.queryEditor');
		this._item = item;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		if (isCommand(message, 'query')) {
			try {
				const { data, properties } = await this._item
					.getConnection()
					.queryWithDescription(message.payload.query);
				this.postMessage({
					command: 'query.result',
					payload: { success: true, data: { data, columns: properties } },
				});
			} catch (error: any) {
				showError(error.message);
				this.postMessage({
					command: 'query.result',
					payload: { success: false, error: { message: error.message } },
				});
			}
			return;
		}
	}
}
