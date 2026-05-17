import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Microservices backend ports
const SERVICES = {
  AUTH:          'http://localhost:8000',  // auth-service
  CORE:          'http://localhost:8001',  // core-api
  RFID:          'http://localhost:8002',  // rfid-service
  WORKFLOW:      'http://localhost:8003',  // workflow-engine
  NOTIFICATION:  'http://localhost:8004',  // notification-service
  REPORTING:     'http://localhost:8005',  // reporting-service
  AUDIT:         'http://localhost:8006',  // audit-service
};

// Map each API path prefix to the correct microservice
function serviceProxy(target: string) {
  return { target, changeOrigin: true };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // auth-service :8000
      '/api/v1/auth':                serviceProxy(SERVICES.AUTH),

      // core-api :8001 — documents, equipment, consumables, studies, sites, users, search, movements, storage
      '/api/v1/documents':           serviceProxy(SERVICES.CORE),
      '/api/v1/equipment':            serviceProxy(SERVICES.CORE),
      '/api/v1/consumables':         serviceProxy(SERVICES.CORE),
      '/api/v1/studies':             serviceProxy(SERVICES.CORE),
      '/api/v1/sites':              serviceProxy(SERVICES.CORE),
      '/api/v1/users':              serviceProxy(SERVICES.CORE),
      '/api/v1/search':             serviceProxy(SERVICES.CORE),
      '/api/v1/movements':          serviceProxy(SERVICES.CORE),

      // rfid-service :8002
      '/api/v1/rfid':                serviceProxy(SERVICES.RFID),

      // workflow-engine :8003
      '/api/v1/access-requests':     serviceProxy(SERVICES.WORKFLOW),

      // notification-service :8004
      '/api/v1/notifications':       serviceProxy(SERVICES.NOTIFICATION),
      // WebSocket pour les notifications temps réel
      '/ws': {
        target: SERVICES.NOTIFICATION,
        changeOrigin: true,
        ws: true,
      },

      // reporting-service :8005
      '/api/v1/reports':             serviceProxy(SERVICES.REPORTING),
      '/api/v1/statistics':          serviceProxy(SERVICES.REPORTING),

      // audit-service :8006
      '/api/v1/audit-trail':         serviceProxy(SERVICES.AUDIT),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
        },
      },
    },
  },
});
