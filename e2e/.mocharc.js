module.exports = {
	diff: true,
	extension: ['ts', 'tsx'],
	reporter: 'spec',
	slow: 75,
	timeout: 5000,
	file: ['src/__tests__/mocha-setup.ts'],
	spec: ['e2e/__tests__/**/*.test.ts', 'e2e/__tests__/*.test.ts'],
	require: ['ts-node/register'],
	exit: true,
	parallel: false,
};
