import { defineConfig } from '@vscode/test-cli';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @type {import('@vscode/test-cli').IConfigurationWithGlobalOptions}
 */
const test = {
	files: ['out/src/extension/__tests__/**/*.test.js', 'out/src/extension/**/__tests__/**/*.test.js'],
	srcDir: 'src',
	coverage: {
		// include: ['src/extension/**/*.ts'],
		// exclude: [`${__dirname}/src/**/__tests__/**/*.test.ts`, '../../shared/**/*.ts'],
		reporter: ['json', 'html'],
		// includeAll: true,
	},
	mocha: {
		require: 'source-map-support/register.js',
		ui: 'bdd',
	},
};

export default defineConfig({
	coverage: test.coverage,
	tests: [test],
});
