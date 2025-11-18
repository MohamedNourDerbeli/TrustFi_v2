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
// Web3Modal is lazily initialized on first use; no side-effect import here

// Enforce dark theme before rendering to avoid FOUC
if (typeof document !== 'undefined') {
  const el = document.documentElement;
  el.dataset.theme = 'dark';
  el.classList.add('dark');
  try { localStorage.setItem('tf-theme', 'dark'); } catch { /* ignore */ }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <DataCacheProvider>
          <AuthProvider>
            <App />
            {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
          </AuthProvider>
        </DataCacheProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
