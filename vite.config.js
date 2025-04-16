import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Automatically open browser
    host: true,  // Allow connections from network
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
  }
});