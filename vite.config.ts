import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: 'react/jsx-dev-runtime', replacement: path.resolve(__dirname, 'node_modules/react/cjs/react-jsx-dev-runtime.development.js') },
        { find: 'react/jsx-runtime', replacement: path.resolve(__dirname, 'node_modules/react/cjs/react-jsx-runtime.development.js') },
        { find: 'react', replacement: path.resolve(__dirname, 'node_modules/react/cjs/react.development.js') },
      ],
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          terms: path.resolve(__dirname, 'terms.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          listingContentPolicy: path.resolve(__dirname, 'listing-content-policy.html'),
        },
      },
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [
        '@lottiefiles/dotlottie-react',
        'fast-deep-equal',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
        'p-retry',
        'react-dom',
        'react-dom/client',
        'retry',
      ],
      exclude: ['react/jsx-dev-runtime', 'react/jsx-runtime']
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: true,
      fs: {
        strict: false
      },
      watch: {
        usePolling: true,
        interval: 250
      },
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true
        }
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
  };
});
