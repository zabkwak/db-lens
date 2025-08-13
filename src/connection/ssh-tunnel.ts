import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import net from 'net';
import os from 'os';
import { ISSHTunnelConfiguration } from '../../shared/types';
import Logger from '../logger';
import { sleep } from '../utils/utils';
import PortManager from './port-manager';

export interface ISSHTunnelOptions extends ISSHTunnelConfiguration {
	/**
	 * The remote port to forward to.
	 * @default 8080
	 */
	remotePort: number;
	/**
	 * The remote host to forward the port to.
	 * @default "localhost"
	 */
	remoteHost: string;
}

export default class SSHTunnel {
	private _config: ISSHTunnelOptions;

	private _sshTunnelProcess: ChildProcessWithoutNullStreams | null = null;

	constructor(config: Partial<ISSHTunnelOptions>) {
		this._config = {
			host: config.host || 'localhost',
			port: config.port || 22,
			username: config.username || os.userInfo().username,
			privateKey: config.privateKey || '',
			passphrase: config.passphrase || null,
			localPort: config.localPort || 8080,
			localHost: config.localHost || 'localhost',
			remotePort: config.remotePort || 8080,
			remoteHost: config.remoteHost || 'localhost',
			connectionTimeout: config.connectionTimeout || 10000,
		};
	}

	public async open(): Promise<void> {
		if (this._sshTunnelProcess) {
			Logger.info('ssh-tunnel', 'SSH Tunnel already started');
			return;
		}
		Logger.info(
			'ssh-tunnel',
			`Opening SSH Tunnel ${this._config.localHost}:${this._config.localPort} -> ${this._config.remoteHost}:${this._config.remotePort}`,
		);
		if (!(await PortManager.isPortAvailable(this._config.localPort, this._config.localHost))) {
			throw new Error(`Local port ${this._config.localPort} is already in use`);
		}
		const { ssh, args } = this._constructCommand();
		this._sshTunnelProcess = spawn(ssh, args, { shell: true });
		this._sshTunnelProcess.stdout?.on('data', (data) => {
			Logger.info('ssh-tunnel', data);
		});
		this._sshTunnelProcess.stderr?.on('data', (data) => {
			Logger.error('ssh-tunnel', data);
			// TODO reject on error
		});
		this._sshTunnelProcess.on('close', (code) => {
			Logger.info('ssh-tunnel', `child process exited with code ${code}`);
		});
		await this._checkConnection();
	}

	public async close(): Promise<void> {
		if (!this._sshTunnelProcess) {
			Logger.warn('ssh-tunnel', 'SSH Tunnel already stopped');
			return;
		}
		Logger.info('ssh-tunnel', 'Closing SSH Tunnel');
		this._sshTunnelProcess.kill();
		this._sshTunnelProcess = null;
	}

	public isOpen(): boolean {
		return !!this._sshTunnelProcess && this._sshTunnelProcess.killed === false;
	}

	public getConfig(): ISSHTunnelOptions {
		return this._config;
	}

	public getHost(): string {
		return this._config.host;
	}

	public getLocalHost(): string {
		return this._config.localHost;
	}

	public getLocalPort(): number {
		return this._config.localPort;
	}

	private async _checkConnection(): Promise<void> {
		const start = Date.now();
		let error: Error | null = null;
		while (Date.now() - start < this._config.connectionTimeout) {
			try {
				await this._tryConnect(this._config.connectionTimeout - (Date.now() - start));
				Logger.info('ssh-tunnel', 'SSH tunnel connection established');
				return;
			} catch (e: any) {
				error = e;
				await sleep(1000);
			}
		}
		// TODO better error handling
		Logger.error('ssh-tunnel', `SSH tunnel connection error: ${error?.message || 'Timeout'}`);
		throw new Error('Could not establish SSH tunnel connection');
	}

	private _constructCommand(): { ssh: string; args: string[] } {
		const { host, port, username, privateKey, passphrase, localPort, localHost, remotePort, remoteHost } =
			this._config;
		const args = [
			// Use the private key if provided
			privateKey ? '-i' : null,
			`${privateKey}`,
			// Do not execute a remote command. Used for port forwarding only (no shell)
			'-N',
			// Local port forwarding
			'-L',
			`${localHost}:${localPort}:${remoteHost}:${remotePort}`,
			`${username}@${host}`,
			'-p',
			`${port}`,
		].filter(Boolean) as string[];
		let sshCommand = 'ssh';
		if (os.platform() === 'win32') {
			// TODO check the git bash path
			sshCommand = 'C:\\Program Files\\Git\\usr\\bin\\ssh.exe'; // Git Bash SSH path
			// Or if using WSL
			// sshCommand = 'C:\\Windows\\System32\\wsl.exe'; // WSL SSH path
		}
		if (passphrase) {
			return {
				ssh: 'sshpass',
				args: ['-p', `${passphrase}`, sshCommand, ...args],
			};
		}
		return { ssh: sshCommand, args };
	}

	private _tryConnect(timeout: number): Promise<void> {
		return new Promise((resolve, reject) => {
			const { localHost, localPort } = this._config;
			const socket = new net.Socket();
			const t = setTimeout(() => {
				socket.destroy();
				reject(new Error(`Connection to ${localHost}:${localPort} timed out`));
			}, timeout);
			socket
				.on('error', (error) => {
					clearTimeout(t);
					reject(error);
				})
				.on('connect', () => {
					clearTimeout(t);
					socket.end();
					resolve();
				})
				// TODO check data event
				.on('close', () => {
					clearTimeout(t);
					reject(new Error('Socket closed before data received'));
				});
			socket.connect({ host: localHost, port: localPort });
		});
	}
}
