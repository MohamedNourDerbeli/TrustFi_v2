import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Ensure Tailwind CSS is processed via the official Vite plugin
  plugins: [react(), tailwindcss()],
  // Explicit base for static hosting like Vercel
  base: '/',
  // Remove console/debugger in production
  esbuild: {
    drop: ['console', 'debugger'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './public'),
    },
  },
  build: {
    // Use esbuild minification (no extra terser install needed)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'wagmi-vendor': ['wagmi', 'viem'],
          'query-vendor': ['@tanstack/react-query'],

          // Admin portal chunk
          admin: [
            './src/components/admin/AdminDashboard.tsx',
            './src/components/admin/CreateTemplate.tsx',
            './src/components/admin/IssuerManagement.tsx',
            './src/components/admin/TemplateManagement.tsx',
          ],

          // Issuer portal chunk
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
    sourcemap: false, // optional: set true if you want source maps
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'viem', '@tanstack/react-query'],
    force: true,
  },
  server: {},
});
