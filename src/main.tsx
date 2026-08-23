import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party browser extension injection errors (e.g. MetaMask, Phantom, Web3 wallets)
// and benign sandboxed Vite WebSocket disconnection notices in preview iframes.
if (typeof window !== 'undefined') {
  const BANNED_PATTERNS = [
    'metamask',
    'ethereum',
    'web3',
    'wallet',
    'solana',
    'phantom',
    'coinbase',
    'extension context',
    'chrome-extension',
    'resizeobserver',
    'websocket',
    'closed without opened',
    'failed to connect to metamask',
    'failed to connect to',
    'error restoring session',
    'restoring session',
    'user rejected'
  ];

  const isIgnorableNoise = (...args: any[]): boolean => {
    if (!args || !args.length) return false;
    let combined = '';
    for (let i = 0; i < args.length; i++) {
      const err = args[i];
      try {
        if (typeof err === 'string') {
          combined += ' ' + err;
        } else if (err instanceof Error) {
          combined += ' ' + err.message + ' ' + (err.stack || '');
        } else if (typeof err === 'object') {
          combined += ' ' + JSON.stringify(err);
        } else {
          combined += ' ' + String(err);
        }
      } catch {
        combined += ' ' + String(err);
      }
    }
    const lower = combined.toLowerCase();
    return BANNED_PATTERNS.some((pattern) => lower.includes(pattern));
  };

  const origWarn = console.warn;
  console.warn = function (...args: any[]) {
    if (isIgnorableNoise(...args)) return;
    return origWarn.apply(console, args);
  };

  const origError = console.error;
  console.error = function (...args: any[]) {
    if (isIgnorableNoise(...args)) return;
    return origError.apply(console, args);
  };

  const origInfo = console.info;
  console.info = function (...args: any[]) {
    if (isIgnorableNoise(...args)) return;
    return origInfo.apply(console, args);
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isIgnorableNoise(event?.reason, event?.reason?.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isIgnorableNoise(event?.message, event?.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ErrorBoundary caught error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfaf5] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-cinzel text-2xl font-bold text-[#012d1d] mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-600 mb-4">An unexpected error occurred. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#012d1d] text-[#fed65b] rounded-xl font-bold text-sm hover:bg-[#144230] transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


