import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Use '.' instead of process.cwd() to prevent type errors.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // Base path for GitHub Pages (assumes deployment at root or handles relative paths)
    base: '/travel/', 
    define: {
      // Safely inject the API key from system environment variables during build
      // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    }
  };
});