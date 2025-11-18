import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Use a custom cache directory to avoid Windows lock issues on node_modules/.vite
  cacheDir: 'node_modules/.vite-cache',
  // Explicit base ensures correct asset URLs on Vercel/static hosting
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'wagmi-vendor': ['wagmi', 'viem'],
          'query-vendor': ['@tanstack/react-query'],
          // Admin portal chunk
          'admin': [
            './src/components/admin/AdminDashboard.tsx',
            './src/components/admin/CreateTemplate.tsx',
            './src/components/admin/IssuerManagement.tsx',
            './src/components/admin/TemplateManagement.tsx',
          ],
          // Issuer portal chunk
          'issuer': [
            './src/components/issuer/IssuerDashboard.tsx',
            './src/components/issuer/TemplateList.tsx',
            './src/components/issuer/IssueCardForm.tsx',
            './src/components/issuer/ClaimLinkGenerator.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'viem'],
    // Force re-bundle on start if cache corrupt; helps recover from EPERM rename failures
    force: true,
  },
});
