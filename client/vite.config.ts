import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './public'),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'wagmi-vendor': ['wagmi', 'viem'],
          'query-vendor': ['@tanstack/react-query'],
          admin: [
            './src/components/admin/AdminDashboard.tsx',
            './src/components/admin/CreateTemplate.tsx',
            './src/components/admin/IssuerManagement.tsx',
            './src/components/admin/TemplateManagement.tsx',
          ],
          issuer: [
            './src/components/issuer/IssuerDashboard.tsx',
            './src/components/issuer/TemplateList.tsx',
            './src/components/issuer/IssueCardForm.tsx',
            './src/components/issuer/ClaimLinkGenerator.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'viem', '@tanstack/react-query'],
    force: true,
  },
});
