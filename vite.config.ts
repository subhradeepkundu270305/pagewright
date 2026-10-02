import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        render: 'src/render/render.html',
        preview: 'src/preview/preview.html',
        playground: 'src/playground/playground.html',
        'content-script': 'src/content/extractor.ts',
      },
      output: {
        // Ensure the content script gets a predictable filename
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content-script') {
            return 'content-script.js';
          }
          return 'assets/[name]-[hash].js';
        },
        banner: (chunk) => {
          if (chunk.name === 'content-script') {
            return '(() => {\n';
          }
          return '';
        },
        footer: (chunk) => {
          if (chunk.name === 'content-script') {
            return '\n})();';
          }
          return '';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
