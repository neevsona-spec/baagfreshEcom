import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party browser extension injection errors (e.g. MetaMask, Phantom, Web3 wallets)
// and benign sandboxed Vite WebSocket disconnection notices in preview iframes.
if (typeof window !== 'undefined') {
  const isIgnorableNoise = (err: any): boolean => {
    if (!err) return false;
    let msg = '';
    try {
      if (typeof err === 'string') {
        msg = err;
      } else if (err instanceof Error) {
        msg = err.message + ' ' + (err.stack || '');
      } else if (typeof err === 'object') {
        msg = JSON.stringify(err);
      } else {
        msg = String(err);
      }
    } catch {
      msg = String(err);
    }
    if (typeof msg !== 'string') return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes('metamask') ||
      lower.includes('ethereum') ||
      lower.includes('web3') ||
      lower.includes('wallet') ||
      lower.includes('solana') ||
      lower.includes('phantom') ||
      lower.includes('coinbase') ||
      lower.includes('extension context') ||
      lower.includes('chrome-extension') ||
      lower.includes('resizeobserver') ||
      lower.includes('websocket') ||
      lower.includes('closed without opened') ||
      lower.includes('failed to connect to websocket') ||
      lower.includes('failed to connect to metamask') ||
      lower.includes('error restoring session') ||
      lower.includes('user rejected')
    );
  };

  const origWarn = console.warn;
  console.warn = function (...args: any[]) {
    for (const arg of args) {
      if (isIgnorableNoise(arg)) return;
    }
    return origWarn.apply(console, args);
  };

  const origError = console.error;
  console.error = function (...args: any[]) {
    for (const arg of args) {
      if (isIgnorableNoise(arg)) return;
    }
    return origError.apply(console, args);
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isIgnorableNoise(event?.reason) || isIgnorableNoise(event?.reason?.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isIgnorableNoise(event?.message) || isIgnorableNoise(event?.error)) {
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


