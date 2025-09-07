import fs from 'fs/promises';
import assert from 'node:assert';
import path from 'path';
import * as vscode from 'vscode';
import Config from '../config';
import Connection, { IConnection, IConnectionGroup } from '../connection/connection';
import Logger from '../logger';
import ConnectionGroup from './connection-group';

export default class ConnectionManager {
	// TODO move this to root connection group?
	private static _connections: (Connection<any, any> | ConnectionGroup)[] | null = null;

	public static async load(): Promise<void> {
		const configPath = this.getConnectionsFilePath();
		try {
			const data = await fs.readFile(configPath, 'utf-8');
			const connectionsData: (IConnection<any, any> | IConnectionGroup)[] = JSON.parse(data);
			this._connections = connectionsData
				.map((config) => {
					if ('connections' in config) {
						return new ConnectionGroup(config);
					}
					try {
						return new Connection(config);
					} catch (error: any) {
						Logger.error('connection', `Failed to create connection ${config.name}: ${error.message}`);
						return null;
					}
				})
				.filter(Boolean) as Connection<any, any>[];
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				Logger.info('connection', `No connections file found at ${configPath}.`);
				this._connections = [];
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
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before adding a new one');
		if (!groupsPath?.length) {
			const existingConnection = this._connections.find((c) => c.getName() === connection.getName());
			if (existingConnection) {
				throw new Error(`Connection with name ${connection.getName()} already exists`);
			}
			this._connections.push(connection);
		} else {
			const group = this._findGroupByPath(groupsPath, this._connections);
			if (!group) {
				throw new Error(`Group path ${groupsPath.join(' -> ')} not found`);
			}
			group.addChild(connection);
		}
		await this._save();
	}

	public static updateConnection(connection: Connection<any, any>): Promise<void>;
	public static updateConnection(connection: Connection<any, any>, groupsPath: string[]): Promise<void>;
	public static async updateConnection(connection: Connection<any, any>, groupsPath?: string[]): Promise<void> {
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before updating one');
		if (!groupsPath?.length) {
			const index = this._connections.findIndex((c) => c.getName() === connection.getName());
			if (index === -1) {
				throw new Error(`Connection with name ${connection.getName()} does not exist`);
			}
			this._connections[index] = connection;
		} else {
			const group = this._findGroupByPath(groupsPath, this._connections);
			if (!group) {
				throw new Error(`Group path ${groupsPath.join(' -> ')} not found`);
			}
			group.updateChild(connection);
		}
		await this._save();
	}

	public static deleteConnection(connection: Connection<any, any>): Promise<void>;
	public static deleteConnection(connection: Connection<any, any>, groupsPath: string[]): Promise<void>;
	public static async deleteConnection(connection: Connection<any, any>, groupsPath?: string[]): Promise<void> {
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before deleting one');
		if (!groupsPath?.length) {
			this._connections = this._connections.filter((c) => c.getName() !== connection.getName());
		} else {
			const group = this._findGroupByPath(groupsPath, this._connections);
			if (!group) {
				throw new Error(`Group path ${groupsPath.join(' -> ')} not found`);
			}
			group.removeChild(connection);
		}
		await this._save();
	}

	public static getConnections(): (Connection<any, any> | ConnectionGroup)[] | null {
		return this._connections;
	}

	public static getConnectionsFilePath(): string {
		return path.join(this.getConfigDirectory(), 'connections.json');
	}

	public static getConfigDirectory(): string {
		return path.join(Config.getBaseDir(), '.db-lens');
	}

	public static clear(): void {
		this._connections = null;
	}

	private static async _save(): Promise<void> {
		if (!this._connections) {
			return;
		}
		const configPath = this.getConnectionsFilePath();
		await fs.mkdir(path.dirname(configPath), { recursive: true });
		await fs.writeFile(configPath, JSON.stringify(this._connections, null, 4), 'utf-8');
	}

	private static _findGroupByPath(
		groupsPath: string[],
		list: (Connection<any, any> | ConnectionGroup)[],
	): ConnectionGroup | null {
		if (!list || !groupsPath.length) {
			return null;
		}
		const [name, ...restPath] = groupsPath;
		const group = list.find(
			(item) => item instanceof ConnectionGroup && item.getName() === name,
		) as ConnectionGroup;
		if (!group) {
			return null;
		}
		if (!restPath.length) {
			return group;
		}
		return this._findGroupByPath(restPath, group.getChildren());
	}
}
