import { exec } from 'child_process';

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
