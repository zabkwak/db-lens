import { exec } from 'child_process';
import mysql, { QueryResult } from 'mysql2/promise';
import { Client } from 'pg';

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

export async function mysqlQuery(query: string, params?: any[]): Promise<QueryResult> {
	let connection: mysql.Connection | null = null;
	try {
		connection = await mysql.createConnection({
			host: 'localhost',
			user: 'db-lens',
			password: 'test',
			database: 'db_lens',
		});
		await connection.connect();
		const [result] = await connection.query(query, params);
		return result;
	} finally {
		await connection?.end();
	}
}

export async function postgresQuery(query: string, params?: any[]): Promise<any[]> {
	let connection: Client | null = null;
	try {
		connection = new Client({
			host: 'localhost',
			user: 'db-lens',
			password: 'test',
			database: 'postgres',
		});
		await connection.connect();
		const result = await connection.query(query, params);
		return result.rows;
	} finally {
		await connection?.end();
	}
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
			database: 'db_lens',
		});
		await connection.connect();
		return true;
	} catch (error) {
		return false;
	} finally {
		await connection?.end();
	}
}
