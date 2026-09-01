import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { spawn, ChildProcess } from 'child_process';

function pythonBackendPlugin(): Plugin {
  let backendProc: ChildProcess | null = null;
  return {
    name: 'vite-plugin-python-backend',
    configureServer() {
      // Auto-start Python FastAPI backend in background on port 8081
      try {
        backendProc = spawn('python3', ['-m', 'uvicorn', 'backend.main:app', '--port', '8081', '--host', '127.0.0.1'], {
          stdio: 'inherit',
          detached: false,
        });
        backendProc.on('error', (err) => {
          console.warn('[FastAPI Backend Warning]', err.message);
        });
      } catch (err: any) {
        console.warn('[FastAPI Auto-start]', err.message);
      }

      const cleanup = () => {
        if (backendProc) {
          try {
            backendProc.kill('SIGTERM');
          } catch {
            // Ignored
          }
        }
      };

      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pythonBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
        },
        '/docs': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
        },
        '/openapi.json': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});


