import * as vscode from 'vscode';
import { EQueryCommand, IMessagePayload, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import Connection from '../../connection/connection';
import { IQueryResult } from '../../drivers/interfaces';
import { isSqlDriver } from '../../drivers/utils';
import { confirmErrorDialog, confirmWarningDialog, showError, showInfo } from '../utils';
import BasePanel from './base.panel';

export default class QueryPanel extends BasePanel {
	private _connection: Connection<any, any>;
	private _namespace: string | null;

	constructor(connection: Connection<any, any>, context: vscode.ExtensionContext, namespace: string | null) {
		super(context, `DB Lens - ${connection.getName()} | ${namespace}`, 'db-lens.queryEditor');
		this._connection = connection;
		this._namespace = namespace;
	}

	protected async _handleMessage(message: IPostMessage<any>): Promise<void> {
		const driver = this._connection.getDriver();
		const { payload, requestId } = message;
		if (isCommand(message, 'query')) {
			try {
				const result = await driver.query(payload.query, payload.timeout as number, this._namespace as string);
				if (result.command === EQueryCommand.SELECT) {
					await result.commit();
					this._sendQueryResult(result, requestId);
					return;
				}
				if (result.command === EQueryCommand.EXPLAIN) {
					await result.rollback();
					throw new Error('EXPLAIN queries are not supported in this context.');
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
		if (isCommand(message, 'query.explain')) {
			try {
				if (!isSqlDriver(driver)) {
					throw new Error(`${driver.getName()} does not support EXPLAIN queries.`);
				}
				const result = await driver.explain(
					payload.query,
					payload.timeout as number,
					this._namespace as string,
				);
				this.postMessage({
					command: 'query.explain.result',
					payload: {
						success: true,
						data: {
							plan: result.plan,
						},
					},
					requestId,
				});
			} catch (error: any) {
				this._sendError(error, 'query.explain.result', requestId);
			}
			return;
		}
		if (isCommand(message, 'query.explainAnalyze')) {
			try {
				if (!isSqlDriver(driver)) {
					throw new Error(`${driver.getName()} does not support EXPLAIN ANALYZE queries.`);
				}
				const result = await driver.explainAnalyze(
					payload.query,
					payload.timeout as number,
					this._namespace as string,
				);
				this.postMessage({
					command: 'query.explainAnalyze.result',
					payload: {
						success: true,
						data: {
							plan: result.plan,
						},
					},
					requestId,
				});
			} catch (error: any) {
				this._sendError(error, 'query.explainAnalyze.result', requestId);
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
		this._sendError(error, 'query.result', requestId);
	}

	private _sendError(error: Error, command: `${string}.result` & keyof IMessagePayload, requestId?: string): void {
		showError(error.message);
		this.postMessage({
			command,
			payload: {
				success: false,
				error: { message: error.message },
			},
			requestId,
		});
	}
}
