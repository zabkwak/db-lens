import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	// files: ["out/__tests__/**/*.test.js", "out/**/__tests__/**/*.test.js"],
	files: ['out/src/extension/__tests__/**/*.test.js', 'out/src/extension/**/__tests__/**/*.test.js'],
	srcDir: 'src',
	// coverage: ['src/extension/**/*.ts'],
	// debug: true,
	mocha: {
		require: 'source-map-support/register.js',
		ui: 'bdd',
	},
});
