import * as vscode from 'vscode';
import Connection from '../../../connection/connection';
import { drivers } from '../../../drivers';
import { passwordProviders } from '../../../password-providers';
import TreeItem from './tree-item';

export enum EConnectionContextValue {
	CONNECTED = 'connection.connected',
	CONNECTING = 'connection.connecting',
	DEFAULT = 'connection',
	DISCONNECTED = 'connection.disconnected',
}

export default class ConnectionTreeItem<
	T extends keyof typeof drivers,
	U extends keyof typeof passwordProviders,
> extends TreeItem {
	private _connection: Connection<T, U>;
	constructor(connection: Connection<T, U>) {
		super(connection.getName(), vscode.TreeItemCollapsibleState.Collapsed);
		this._connection = connection;
		this.contextValue = EConnectionContextValue.DEFAULT;
	}

	public getConnection(): Connection<T, U> {
		return this._connection;
	}

	public getIcon(): vscode.ThemeIcon | undefined {
		if (this.contextValue === EConnectionContextValue.CONNECTING) {
			return new vscode.ThemeIcon('loading~spin');
		}
		if (this.contextValue === EConnectionContextValue.CONNECTED) {
			return new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green'));
		}
		return new vscode.ThemeIcon('database');
	}

	public async connect(): Promise<void> {
		await this._connection.connect();
	}
}
