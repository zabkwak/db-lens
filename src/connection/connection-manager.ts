import fs from 'fs/promises';
import assert from 'node:assert';
import path from 'path';
import * as vscode from 'vscode';
import Config from '../config';
import Connection, { IConnection, IConnectionGroup } from '../connection/connection';
import Logger from '../logger';
import ConnectionGroup from './connection-group';

export default class ConnectionManager {
	private static _root: ConnectionGroup | null = null;

	public static async load(): Promise<void> {
		const configPath = this.getConnectionsFilePath();
		try {
			const data = await fs.readFile(configPath, 'utf-8');
			const connectionsData: (IConnection<any, any> | IConnectionGroup)[] = JSON.parse(data);
			this._root = ConnectionGroup.createRoot(connectionsData);
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				Logger.info('connection', `No connections file found at ${configPath}.`);
				this._root = ConnectionGroup.createRoot([]);
			} else {
				Logger.error('connection', `Failed to load connections: ${error.message}`);
				vscode.window.showErrorMessage(`Failed to load connections: ${error.message}`);
				throw error;
			}
		}
	}

	public static addConnection(connection: Connection<any, any>): Promise<void>;
	public static addConnection(connection: Connection<any, any>, groupsPath: string[]): Promise<void>;
	public static async addConnection(connection: Connection<any, any>, groupsPath?: string[]): Promise<void> {
		if (!this._root) {
			await this.load();
		}
		assert(this._root, 'Connections should be loaded before adding a new one');
		const group = !groupsPath?.length ? this._root : this._root.findGroupByPath(...groupsPath);
		group.addChild(connection);
		await this._save();
	}

	public static updateConnection(connection: Connection<any, any>): Promise<void>;
	public static updateConnection(connection: Connection<any, any>, groupsPath: string[]): Promise<void>;
	public static async updateConnection(connection: Connection<any, any>, groupsPath?: string[]): Promise<void> {
		if (!this._root) {
			await this.load();
		}
		assert(this._root, 'Connections should be loaded before updating one');
		const group = !groupsPath?.length ? this._root : this._root.findGroupByPath(...groupsPath);
		group.updateChild(connection);
		await this._save();
	}

	public static deleteConnection(connection: Connection<any, any>): Promise<void>;
	public static deleteConnection(connection: Connection<any, any>, groupsPath: string[]): Promise<void>;
	public static async deleteConnection(connection: Connection<any, any>, groupsPath?: string[]): Promise<void> {
		if (!this._root) {
			await this.load();
		}
		assert(this._root, 'Connections should be loaded before deleting one');
		const group = !groupsPath?.length ? this._root : this._root.findGroupByPath(...groupsPath);
		group.removeChild(connection);
		await this._save();
	}

	public static getConnections(): (Connection<any, any> | ConnectionGroup)[] | null {
		return this._root ? this._root.getChildren() : null;
	}

	public static getConnectionsFilePath(): string {
		return path.join(this.getConfigDirectory(), 'connections.json');
	}

	public static getConfigDirectory(): string {
		return path.join(Config.getBaseDir(), '.db-lens');
	}

	public static clear(): void {
		this._root = null;
	}

	private static async _save(): Promise<void> {
		if (!this._root) {
			return;
		}
		const configPath = this.getConnectionsFilePath();
		await fs.mkdir(path.dirname(configPath), { recursive: true });
		await fs.writeFile(configPath, JSON.stringify(this._root.getChildren(), null, 4), 'utf-8');
	}
}
