// module.exports = {
//   require: ["ts-node/register"],
//   extension: ["ts"],
//   spec: "src/**/*.test.ts",
//   ignore: ["src/test/*"],
//   timeout: 5000,
// };

module.exports = {
	diff: true,
	extension: ['ts', 'tsx'],
	package: './package.json',
	reporter: 'spec',
	slow: 75,
	timeout: 5000,
	file: ['src/__tests__/mocha-setup.ts'],
	spec: [
		'./src/__tests__/*.test.ts',
		'./src/**/__tests__/**/*.test.ts',
		// "./__tests__/**/*.test.ts",
		// "./app/__tests__/**/*.test.ts",
		// "./app/__tests__/**/*.test.tsx",
		// "./app/**/__tests__/**/*.test.ts",
		// "./app/**/__tests__/**/*.test.tsx",
	],
	ignore: ['src/__tests__/*'],
	require: ['ts-node/register'],
	exit: true,
	parallel: false,
};
