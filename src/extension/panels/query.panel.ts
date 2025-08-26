import * as vscode from 'vscode';
import { EQueryCommand, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import { IQueryResult } from '../../drivers/interfaces';
import ConnectionTreeItem from '../providers/tree-items/connection.tree-item';
import { confirmErrorDialog, confirmWarningDialog, showError, showInfo } from '../utils';
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
				const result = await this._item.getConnection().getDriver().query(payload.query);
				if (result.command === EQueryCommand.SELECT) {
					await result.commit();
					this._sendQueryResult(result, requestId);
					return;
				}
				let confirmed = false;
				switch (result.command) {
					case EQueryCommand.UPDATE:
						confirmed = await confirmWarningDialog(
							`The query will change ${result.rowCount} rows. Proceed?`,
							'Confirm',
						);
						break;
					case EQueryCommand.INSERT:
						confirmed = await confirmWarningDialog(
							`The query will insert ${result.rowCount} rows. Proceed?`,
							'Confirm',
						);
						break;
					case EQueryCommand.DELETE:
						confirmed = await confirmErrorDialog(
							`The query will delete ${result.rowCount} rows. Proceed?`,
							'Confirm',
						);
						break;
					default:
						confirmed = await confirmWarningDialog(
							`This query may alter the database schema or data. Proceed?`,
							'Confirm',
						);
						break;
				}
				if (confirmed) {
					await result.commit();
					showInfo(`Query executed successfully, affected ${result.rowCount} rows.`);
					this._sendQueryResult(result, requestId);
					return;
				}
				await result.rollback();
				this._sendQueryError(new Error('Query was canceled'), requestId);
			} catch (error: any) {
				this._sendQueryError(error, requestId);
			}
			return;
		}
	}

	private _sendQueryResult(result: IQueryResult<unknown>, requestId: string | undefined): void {
		this.postMessage({
			command: 'query.result',
			payload: {
				success: true,
				data: {
					data: result.data,
					columns: result.properties,
					rowCount: result.rowCount,
					command: result.command,
				},
			},
			requestId,
		});
	}

	private _sendQueryError(error: Error, requestId: string | undefined): void {
		showError(error.message);
		this.postMessage({
			command: 'query.result',
			payload: {
				success: false,
				error: { message: error.message },
			},
			requestId,
		});
	}
}
