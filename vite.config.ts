import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isAdminRequest = (url?: string) =>
  url?.split('?')[0].replace(/\/+$/, '') === '/adm';

const adminRouteFallback = () => ({
  name: 'admin-route-fallback',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (isAdminRequest(req.url)) {
        const templatePath = path.resolve(__dirname, 'index.html');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = await server.transformIndexHtml('/index.html', template);
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
        return;
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (isAdminRequest(req.url)) {
        const html = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
        return;
      }
      next();
    });
  }
});

export default defineConfig(() => {
  return {
    appType: 'spa' as const,
    plugins: [adminRouteFallback(), react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
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
