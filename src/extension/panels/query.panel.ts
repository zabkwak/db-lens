import * as vscode from 'vscode';
import { IPostMessage } from '../../../shared/types';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import BasePanel from './base.panel';

export default class QueryPanel extends BasePanel {
	private _item: ConnectionTreeItem<any, any>;

	constructor(item: ConnectionTreeItem<any, any>, context: vscode.ExtensionContext) {
		super(context, `DB Lens - ${item.label}`, 'db-lens.queryEditor');
		this._item = item;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		switch (message.command) {
			case 'query':
				const { data, properties } = await this._item.getConnection().queryWithDescription(message.payload);
				this.postMessage({
					command: 'result',
					payload: { data, columns: properties },
				});
				break;
		}
	}
}
