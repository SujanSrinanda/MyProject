import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { spawn } from 'child_process';
import { defineConfig, Plugin } from 'vite';

function fastApiPlugin(): Plugin {
  let fastApiProcess: any = null;
  return {
    name: 'vite-plugin-fastapi-backend',
    configureServer(server) {
      try {
        console.log('[FastAPI] Spawning Python FastAPI backend on port 8081...');
        fastApiProcess = spawn('python3', ['-m', 'uvicorn', 'backend.main:app', '--port', '8081', '--host', '127.0.0.1'], {
          stdio: 'inherit',
        });
        fastApiProcess.on('error', (err: any) => {
          console.warn('[FastAPI] Could not spawn FastAPI process:', err?.message);
        });
      } catch (err: any) {
        console.warn('[FastAPI] Failed to start uvicorn:', err?.message);
      }

      server.httpServer?.on('close', () => {
        if (fastApiProcess) {
          fastApiProcess.kill();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), fastApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
        },
        '/docs': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
        },
        '/openapi.json': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
