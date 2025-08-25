import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			output: {
				// Do not add hash to entry files (e.g., index.js)
				entryFileNames: `assets/[name].js`,
				// Do not add hash to chunk files (code-splitted files)
				chunkFileNames: `assets/[name].js`,
				// Do not add hash to asset files (e.g., CSS, images)
				assetFileNames: `assets/[name].[ext]`,
			},
		},
	},
});
