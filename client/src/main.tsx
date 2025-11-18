import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiConfig } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from "./App";
import "./index.css"; // Tailwind CSS
import { config } from './lib/wagmi';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { DataCacheProvider } from './contexts/DataCacheContext';
// Initialize Web3Modal (side-effect import)
import './lib/web3modal';

// Enforce dark theme before rendering to avoid FOUC
if (typeof document !== 'undefined') {
  const el = document.documentElement;
  el.dataset.theme = 'dark';
  el.classList.add('dark');
  try { localStorage.setItem('tf-theme', 'dark'); } catch {}
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <DataCacheProvider>
          <AuthProvider>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </DataCacheProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
