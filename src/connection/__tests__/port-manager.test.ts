import { expect } from 'chai';
import { after, before } from 'mocha';
import net from 'net';
import PortManager from '../port-manager';

describe('PortManager', () => {
	let server: net.Server;

	before((done) => {
		server = net.createServer();
		server.on('error', done).listen(3333, 'localhost', done);
	});

	after((done) => {
		server?.close(done);
	});

	describe('isPortAvailable', () => {
		it('should return true for an available port', async () => {
			expect(await PortManager.isPortAvailable(3334, 'localhost')).to.be.true;
		});

		it('should return false for an unavailable port', async () => {
			expect(await PortManager.isPortAvailable(3333, 'localhost')).to.be.false;
		});
	});

	describe('.getAvailablePort', () => {
		it('should return a random available port from the specified range', async () => {
			expect(await PortManager.getAvailablePort(3333, 3335, 'localhost')).to.be.equal(3334);
		});
	});
});
