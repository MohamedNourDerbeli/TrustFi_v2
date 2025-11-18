import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Custom cache dir to avoid Windows lock issues
  cacheDir: 'node_modules/.vite-cache',
  // Base path for assets
  base: '/',
  // Remove console/debugger in production
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  build: {
    target: 'es2020',
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
    sourcemap: false, // optional: set to true if you want source maps
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'viem'],
    force: true,
  },
  // SPA fallback for dev server
  server: {
    historyApiFallback: true,
  },
});
