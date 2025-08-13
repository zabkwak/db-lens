import net from 'net';

export default class PortManager {
	public static isPortAvailable(port: number, host: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const server = net.createServer();
			server
				.on('error', (err: any) => {
					if (err.code === 'EADDRINUSE') {
						resolve(false);
						return;
					}
					reject(err);
				})
				.listen({ port, host, exclusive: true }, () => {
					server.close(() => {
						resolve(true);
					});
				});
		});
	}

	public static async getAvailablePort(min: number, max: number, host: string): Promise<number> {
		for (let port = min; port <= max; port++) {
			if (await this.isPortAvailable(port, host)) {
				return port;
			}
		}
		throw new Error('No available port found');
	}
}
