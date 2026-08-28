import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { metrics, connection } = useFinancialMetrics();

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="workspace">
        <Topbar connection={connection} onMenu={() => setMenuOpen(true)} />
        <main className="page-container">
          <Outlet context={{ metrics, connection }} />
        </main>
      </div>
    </div>
  );
}

export default AppShell;