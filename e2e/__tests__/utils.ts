import { exec } from 'child_process';
import mysql from 'mysql2/promise';

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cleanup(): Promise<void> {
	await killPortProcess();
}

function killPortProcess(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		exec(
			process.platform === 'win32'
				? 'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :1111\') do taskkill /PID %a /F'
				: 'lsof -ti:1111 | xargs kill -9',
			(error) => {
				resolve();
			},
		);
	});
}

export async function waitForMysqlReady(): Promise<void> {
	const timeout = 10000;
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (await isMySqlReady()) {
			return;
		}
		await sleep(500);
	}
	throw new Error('MySQL is not ready');
}

async function isMySqlReady(): Promise<boolean> {
	let connection: mysql.Connection | null = null;
	try {
		connection = await mysql.createConnection({
			host: 'localhost',
			user: 'db-lens',
			password: 'test',
			database: 'mysql',
		});
		await connection.connect();
		return true;
	} catch (error) {
		return false;
	} finally {
		await connection?.end();
	}
}
