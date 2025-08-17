import fs from 'fs/promises';
import assert from 'node:assert';
import path from 'path';
import * as vscode from 'vscode';
import Config from '../config';
import Connection, { IConnection } from '../connection/connection';
import Logger from '../logger';

export default class ConnectionManager {
	private static _connections: Connection<any, any>[] | null = null;

	public static async load(): Promise<void> {
		const configPath = this.getConnectionsFilePath();
		// TODO connection groups
		try {
			const data = await fs.readFile(configPath, 'utf-8');
			const connectionsData: Record<string, IConnection<any, any>> = JSON.parse(data);
			this._connections = await Promise.all(
				Object.entries(connectionsData).map(async ([name, config]) => Connection.create(name, config)),
			);
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				Logger.info('connection', `No connections file found at ${configPath}.`);
				this._connections = [];
			} else {
				Logger.error('connection', `Failed to load connections: ${error.message}`);
				vscode.window.showErrorMessage(`Failed to load connections: ${error.message}`);
			}
		}
	}

	public static async addConnection(connection: Connection<any, any>): Promise<void> {
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before adding a new one');
		const existingConnection = this._connections.find((c) => c.getName() === connection.getName());
		if (existingConnection) {
			throw new Error(`Connection with name ${connection.getName()} already exists`);
		}
		this._connections.push(connection);
		await this._save();
	}

	public static async updateConnection(connection: Connection<any, any>): Promise<void> {
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before updating one');
		const index = this._connections.findIndex((c) => c.getName() === connection.getName());
		if (index === -1) {
			throw new Error(`Connection with name ${connection.getName()} does not exist`);
		}
		this._connections[index] = connection;
		await this._save();
	}

	public static async deleteConnection(connection: Connection<any, any>): Promise<void> {
		if (!this._connections) {
			await this.load();
		}
		assert(this._connections, 'Connections should be loaded before deleting one');
		this._connections = this._connections.filter((c) => c.getName() !== connection.getName());
		await this._save();
	}

	public static getConnections(): Connection<any, any>[] | null {
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
		const connectionsData: Record<string, IConnection<any, any>> = this._connections.reduce((acc, connection) => {
			return {
				...acc,
				[connection.getName()]: connection.getConnection(),
			};
		}, {} as Record<string, IConnection<any, any>>);
		await fs.mkdir(path.dirname(configPath), { recursive: true });
		await fs.writeFile(configPath, JSON.stringify(connectionsData, null, 4), 'utf-8');
	}
}
