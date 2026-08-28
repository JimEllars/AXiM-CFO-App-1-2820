import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/layout/ErrorBoundary';
import './App.css';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    }
  }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;