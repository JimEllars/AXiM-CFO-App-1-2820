import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/layout/ErrorBoundary';
import * as FiIcons from 'react-icons/fi';
import './App.css';

const { FiLock } = FiIcons;

function SessionExpiredPrompt() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131715]/90 backdrop-blur-sm">
      <div className="bg-[#1e2321] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 mb-6">
          <FiLock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Session Expired</h2>
        <p className="text-slate-400 mb-8">
          Your enterprise zero-trust session has expired. Please re-authenticate to continue accessing the CFO dashboard.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
        >
          Re-authenticate via Cloudflare Access
        </button>
      </div>
    </div>
  );
}

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Cloudflare Access returns a 401/403 or redirects to /cdn-cgi/access/login
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.url.includes('/cdn-cgi/access/login') ||
          response.headers.get('cf-access-jwt-assertion') === 'invalid'
        ) {
          setSessionExpired(true);
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (sessionExpired) {
    return <SessionExpiredPrompt />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
