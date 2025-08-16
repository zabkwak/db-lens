import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	// files: ["out/__tests__/**/*.test.js", "out/**/__tests__/**/*.test.js"],
	files: ['out/src/extension/__tests__/**/*.test.js'],
});
