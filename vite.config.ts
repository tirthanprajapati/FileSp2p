import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['simple-peer'],
  },
  define: {
    global: 'window'
  },
  build: {
    // Increase the warning limit to 1000KB (1MB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-utils': ['uuid', 'socket.io-client', 'simple-peer'],
          // Split app by features
          'feature-transfer': [
            './src/components/transfer/FileDropZone.tsx',
            './src/components/transfer/TransferProgress.tsx',
            './src/utils/webrtc.ts'
          ]
        }
      }
    }
  }
});