import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), istanbul({ requireEnv: false })],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: './src/__tests__/setupTests.ts',
		coverage: {
			provider: 'istanbul',
			reporter: ['json'],
			all: true,
			exclude: ['src/vscode-api.ts', 'dist'],
		},
	},
});
