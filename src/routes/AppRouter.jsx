import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ApprovalDeskPage from '../pages/ApprovalDeskPage';
import CFODashboard from '../pages/CFODashboard';

function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<CFODashboard />} />
        <Route path="/approvals" element={<ApprovalDeskPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;