import { expect } from 'chai';
import os from 'os';
import sinon from 'sinon';
import SSHTunnel from '../ssh-tunnel';

describe('SSH Tunnel', () => {
	let userInfoStub: any;

	beforeEach(() => {
		userInfoStub = sinon
			.stub(os, 'userInfo')
			.returns({ username: 'user', uid: 1, gid: 1, homedir: '/home/user', shell: '/bin/bash' });
	});

	afterEach(() => {
		userInfoStub.restore();
	});

	describe.skip('._constructCommand', () => {
		it('should call SSH command with default arguments', () => {
			const tunnel = new SSHTunnel({});
			// @ts-expect-error
			const { ssh, args } = tunnel._constructCommand();
			expect(ssh).to.equal('ssh');
			expect(args).to.deep.equal(['-N', '-L', 'localhost:8080:localhost:8080', 'user@localhost', '-p', '22']);
		});

		it('should call SSH command with password without private key', () => {
			const tunnel = new SSHTunnel({ passphrase: 'password' });
			// @ts-expect-error
			const { ssh, args } = tunnel._constructCommand();
			expect(ssh).to.equal('sshpass');
			expect(args).to.deep.equal([
				'-p',
				'password',
				'ssh',
				'-N',
				'-L',
				'localhost:8080:localhost:8080',
				'user@localhost',
				'-p',
				'22',
			]);
		});

		it('should call SSH command with private key', () => {
			const tunnel = new SSHTunnel({ privateKey: '/path/to/key' });
			// @ts-expect-error
			const { ssh, args } = tunnel._constructCommand();
			expect(ssh).to.equal('ssh');
			expect(args).to.deep.equal([
				'-i',
				'/path/to/key',
				'-N',
				'-L',
				'localhost:8080:localhost:8080',
				'user@localhost',
				'-p',
				'22',
			]);
		});

		it('should call SSH command with private key and password', () => {
			const tunnel = new SSHTunnel({ privateKey: '/path/to/key', passphrase: 'password' });
			// @ts-expect-error
			const { ssh, args } = tunnel._constructCommand();
			expect(ssh).to.equal('sshpass');
			expect(args).to.deep.equal([
				'-p',
				'password',
				'ssh',
				'-i',
				'/path/to/key',
				'-N',
				'-L',
				'localhost:8080:localhost:8080',
				'user@localhost',
				'-p',
				'22',
			]);
		});
	});
});
