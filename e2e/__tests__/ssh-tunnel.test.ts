import { expect } from 'chai';
import path from 'path';
import SSHTunnelError, { ECode } from '../../src/connection/errors/ssh-tunnel.error';
import SSHTunnel from '../../src/connection/ssh-tunnel';
import { cleanup } from './utils';

describe('SSH Tunnel', () => {
	afterEach(async () => {
		await cleanup();
	});

	describe('.open', () => {
		const tunnel = new SSHTunnel({
			host: 'localhost',
			port: 2222,
			username: 'testuser',
			privateKey: path.resolve(__dirname, '../ssh_key'),
			passphrase: null,
			localPort: 1111,
			localHost: 'localhost',
			remotePort: 5432,
			remoteHost: 'postgres',
			strictHostChecking: false,
			userKnownHostsFile: '/dev/null',
		});

		afterEach(async () => {
			await tunnel.close();
		});

		it('should establish a tunnel', async () => {
			expect(tunnel.isOpen()).to.be.false;
			await tunnel.open();
			expect(tunnel.isOpen()).to.be.true;
		}).timeout(30000);

		it('should fail to open the tunnel', async () => {
			const tunnel = new SSHTunnel({
				host: 'localhost',
				port: 2222,
				username: 'some-user',
				privateKey: path.resolve(__dirname, '../ssh_key'),
				passphrase: null,
				localPort: 1111,
				localHost: 'localhost',
				remotePort: 5432,
				remoteHost: 'postgres',
				strictHostChecking: false,
				userKnownHostsFile: '/dev/null',
			});
			await expect(tunnel.open())
				.to.eventually.be.rejectedWith(
					SSHTunnelError,
					'some-user@localhost: Permission denied (publickey,keyboard-interactive).',
				)
				.and.to.have.property('code', ECode.PERMISSION_DENIED);
			expect(tunnel.isOpen()).to.be.false;
			// @ts-expect-error
			expect(tunnel._sshTunnelProcess).to.be.null;
			// @ts-expect-error
			expect(tunnel._opened).to.be.false;
		}).timeout(30000);

		it('should fail to open the tunnel due to timeout', async () => {
			const tunnel = new SSHTunnel({
				host: 'localhost',
				port: 2222,
				username: 'testuser',
				privateKey: path.resolve(__dirname, '../ssh_key'),
				passphrase: null,
				localPort: 1111,
				localHost: 'localhost',
				remotePort: 5432,
				remoteHost: 'postgres',
				strictHostChecking: false,
				userKnownHostsFile: '/dev/null',
				connectionTimeout: 10,
			});
			await expect(tunnel.open())
				.to.eventually.be.rejectedWith(SSHTunnelError, 'Could not establish SSH tunnel connection')
				.and.to.have.property('code', ECode.CONNECTION_REFUSED);
			expect(tunnel.isOpen()).to.be.false;
			// @ts-expect-error
			expect(tunnel._sshTunnelProcess).to.be.null;
			// @ts-expect-error
			expect(tunnel._opened).to.be.false;
		});
	});

	describe('.close', () => {
		it('should close the tunnel', async () => {
			const tunnel = new SSHTunnel({
				host: 'localhost',
				port: 2222,
				username: 'testuser',
				privateKey: path.resolve(__dirname, '../ssh_key'),
				passphrase: null,
				localPort: 1111,
				localHost: 'localhost',
				remotePort: 5432,
				remoteHost: 'postgres',
				strictHostChecking: false,
				userKnownHostsFile: '/dev/null',
			});
			await tunnel.open();
			expect(tunnel.isOpen()).to.be.true;
			await tunnel.close();
			expect(tunnel.isOpen()).to.be.false;
			// @ts-expect-error
			expect(tunnel._sshTunnelProcess).to.be.null;
			// @ts-expect-error
			expect(tunnel._opened).to.be.false;
		}).timeout(30000);
	});
});
