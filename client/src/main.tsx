import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Filter out browser extension errors in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('message channel closed') ||
      args[0]?.includes?.('listener indicated an asynchronous response')
    ) {
      return; // Suppress browser extension errors
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
