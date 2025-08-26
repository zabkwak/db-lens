import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import net from 'net';
import assert from 'node:assert';
import os from 'os';
import { ISSHTunnelConfiguration } from '../../shared/types';
import Config from '../config';
import Logger from '../logger';
import { sleep } from '../utils/utils';
import SSHTunnelError, { ECode } from './errors/ssh-tunnel.error';
import PortManager from './port-manager';

const MAX_TIMEOUT_CHECK_TICK = 1000;
const SPAWN_ERROR_WAIT_TIME = 500;

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
	strictHostChecking: boolean | null;
	userKnownHostsFile: string | null;
}

export default class SSHTunnel {
	private _config: ISSHTunnelOptions;

	private _sshTunnelProcess: ChildProcessWithoutNullStreams | null = null;

	private _randomPort: number | null = null;

	private _opened: boolean = false;

	constructor(config: Partial<ISSHTunnelOptions>) {
		this._config = {
			host: config.host || 'localhost',
			port: config.port || 22,
			username: config.username || os.userInfo().username,
			privateKey: config.privateKey || '',
			passphrase: config.passphrase || null,
			localPort: config.localPort || null,
			localHost: config.localHost || 'localhost',
			remotePort: config.remotePort || 8080,
			remoteHost: config.remoteHost || 'localhost',
			connectionTimeout: config.connectionTimeout || 10000,
			strictHostChecking: config.strictHostChecking ?? null,
			userKnownHostsFile: config.userKnownHostsFile ?? null,
		};
	}

	public async open(): Promise<void> {
		if (this._sshTunnelProcess) {
			Logger.info('ssh-tunnel', 'SSH Tunnel already started');
			return;
		}
		if (!this._config.localPort) {
			Logger.info('ssh-tunnel', 'No local port specified, searching for random port');
			const [min, max] = Config.getPortRange();
			this._randomPort = await PortManager.getAvailablePort(min, max, this._config.localHost);
			Logger.info('ssh-tunnel', `Using random local port ${this._randomPort}`);
		}
		Logger.info(
			'ssh-tunnel',
			`Opening SSH Tunnel ${this._config.localHost}:${this.getLocalPort()} -> ${this._config.remoteHost}:${
				this._config.remotePort
			}`,
		);
		if (!(await PortManager.isPortAvailable(this.getLocalPort(), this._config.localHost))) {
			throw new Error(`Local port ${this.getLocalPort()} is already in use`);
		}
		const { ssh, args } = this._constructCommand();
		let error: Error | null = null;
		this._sshTunnelProcess = spawn(ssh, args, { shell: true });
		this._sshTunnelProcess.stdout?.on('data', (data) => {
			Logger.info('ssh-tunnel', data);
		});
		this._sshTunnelProcess.stderr?.on('data', (data) => {
			try {
				this._processStdError(data);
			} catch (err: any) {
				Logger.error('ssh-tunnel', `SSH Tunnel error: ${err.message}`);
				error = err;
			}
		});
		this._sshTunnelProcess.on('close', (code) => {
			Logger.info('ssh-tunnel', `child process exited with code ${code}`);
		});
		await sleep(Math.min(SPAWN_ERROR_WAIT_TIME, this._config.connectionTimeout));
		if (error) {
			// If some non-warning error occurs kill the process
			await this.close();
			throw error;
		}
		await this._checkConnection();
		this._opened = true;
	}

	public async close(): Promise<void> {
		if (!this._sshTunnelProcess) {
			Logger.warn('ssh-tunnel', 'SSH Tunnel already stopped');
			return;
		}
		Logger.info('ssh-tunnel', 'Closing SSH Tunnel');
		this._sshTunnelProcess.kill();
		this._sshTunnelProcess = null;
		this._opened = false;
	}

	public isOpen(): boolean {
		return !!this._sshTunnelProcess && this._sshTunnelProcess.killed === false && this._opened;
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
		assert(this._randomPort || this._config.localPort, 'Local port is not set');
		return (this._randomPort || this._config.localPort) as number;
	}

	private async _checkConnection(): Promise<void> {
		const start = Date.now();
		const { connectionTimeout } = this._config;
		let error: any | null = null;
		const tick = Math.max(MAX_TIMEOUT_CHECK_TICK, connectionTimeout / 10);
		while (Date.now() - start < connectionTimeout) {
			try {
				await this._tryConnect(connectionTimeout - (Date.now() - start));
				Logger.info('ssh-tunnel', 'SSH tunnel connection established');
				return;
			} catch (e: any) {
				error = e;
				await sleep(tick);
			}
		}
		// TODO better error handling
		Logger.error('ssh-tunnel', `SSH tunnel connection error: ${error?.message || 'Timeout'}`);
		await this.close();
		throw new SSHTunnelError(
			'Could not establish SSH tunnel connection',
			error?.code === 'ECONNREFUSED' ? ECode.CONNECTION_REFUSED : ECode.CONNECTION_TIMEOUT,
		);
	}

	private _constructCommand(): { ssh: string; args: string[] } {
		const {
			host,
			port,
			username,
			privateKey,
			passphrase,
			localHost,
			remotePort,
			remoteHost,
			strictHostChecking,
			userKnownHostsFile,
		} = this._config;
		const args = [
			// Use the private key if provided
			privateKey ? '-i' : null,
			`${privateKey}`,
			// Do not execute a remote command. Used for port forwarding only (no shell)
			'-N',
			// Local port forwarding
			'-L',
			`${localHost}:${this.getLocalPort()}:${remoteHost}:${remotePort}`,
			`${username}@${host}`,
			'-p',
			`${port}`,
		].filter(Boolean) as string[];
		if (strictHostChecking !== null) {
			args.push('-o', `StrictHostKeyChecking=${strictHostChecking ? 'yes' : 'no'}`);
		}
		if (userKnownHostsFile !== null) {
			args.push('-o', `UserKnownHostsFile=${userKnownHostsFile}`);
		}
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
			const { localHost } = this._config;
			const socket = new net.Socket();
			const t = setTimeout(() => {
				socket.destroy();
				reject(new Error(`Connection to ${localHost}:${this.getLocalPort()} timed out`));
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
			socket.connect({ host: localHost, port: this.getLocalPort() });
		});
	}

	private _processStdError(data: Buffer): void {
		const message: string = data.toString().trim();
		if (message.startsWith('Warning: Permanently added')) {
			Logger.warn('ssh-tunnel', message);
			return;
		}
		throw new SSHTunnelError(message);
	}
}
