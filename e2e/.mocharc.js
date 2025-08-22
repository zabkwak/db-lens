module.exports = {
	diff: true,
	extension: ['ts', 'tsx'],
	reporter: 'spec',
	slow: 75,
	timeout: 5000,
	file: ['mocha-setup.ts'],
	spec: ['__tests__/**/*.test.ts', '__tests__/*.test.ts'],
	require: ['ts-node/register'],
	exit: true,
	parallel: false,
};
