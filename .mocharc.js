module.exports = {
	diff: true,
	extension: ['ts', 'tsx'],
	reporter: 'spec',
	slow: 75,
	timeout: 5000,
	file: ['src/__tests__/mocha-setup.ts'],
	spec: ['./src/__tests__/*.test.ts', './src/**/*.test.ts', './src/**/__tests__/**/*.test.ts'],
	ignore: ['src/extension/__tests__/*', 'src/extension/**/__tests__/*'],
	require: ['ts-node/register'],
	exit: true,
	parallel: false,
};
