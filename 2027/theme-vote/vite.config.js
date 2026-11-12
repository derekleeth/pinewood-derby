import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    // Allow importing ../shared (themes + car art shared with the video).
    fs: { allow: ['..'] },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        leader: resolve(import.meta.dirname, 'leader/index.html'),
        reveal: resolve(import.meta.dirname, 'reveal/index.html'),
      },
    },
  },
});
