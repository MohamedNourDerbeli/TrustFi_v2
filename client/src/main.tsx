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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <AuthProvider>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
