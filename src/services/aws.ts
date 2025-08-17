import { exec } from 'child_process';

interface IAttribute {
	name: string;
	value?: string;
}

export function awsCommand(
	command: string,
	fn: string,
	region: string,
	profile: string,
	attributes: IAttribute[],
): Promise<string>;
export function awsCommand<T>(
	command: string,
	fn: string,
	region: string,
	profile: string,
	attributes: IAttribute[],
	parseJSON: false,
): Promise<string>;
export function awsCommand<T>(
	command: string,
	fn: string,
	region: string,
	profile: string,
	attributes: IAttribute[],
	parseJSON: true,
): Promise<T>;
export function awsCommand<T>(
	command: string,
	fn: string,
	region: string,
	profile: string,
	attributes: IAttribute[],
	parseJSON: boolean = false,
): Promise<T | string> {
	return new Promise((resolve, reject) => {
		const cmd = [
			'aws',
			command,
			fn,
			'--region',
			region,
			'--profile',
			profile,
			...attributes
				.map(({ name, value }) => [`--${name}`, value])
				.flat()
				.filter(Boolean),
		];
		exec(cmd.join(' '), (err, stdout, stderr) => {
			if (err) {
				reject(err);
				return;
			}
			// TODO handle stderr
			if (!parseJSON) {
				resolve(stdout.trim());
				return;
			}
			try {
				resolve(JSON.parse(stdout.trim()));
			} catch (error) {
				reject(error);
			}
		});
	});
}
