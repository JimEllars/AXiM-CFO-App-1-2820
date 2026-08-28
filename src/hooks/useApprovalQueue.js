import { useCallback, useEffect, useState } from 'react';
import { initialApprovals } from '../data/financialData';

const STORAGE_KEY = 'axim-cfo-approval-queue';
const AUDIT_KEY = 'axim-cfo-audit-log';

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage is best effort.
  }
}

export function useApprovalQueue() {
  const [error, setError] = useState(null);

  if (error) {
    throw error;
  }
  const [items, setItems] = useState(() => (
    readStorage(STORAGE_KEY, initialApprovals)
  ));
  const [auditLog, setAuditLog] = useState(() => (
    readStorage(AUDIT_KEY, [])
  ));

  useEffect(() => {
    writeStorage(STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    writeStorage(AUDIT_KEY, auditLog);
  }, [auditLog]);

  const recordAction = useCallback((item, decision, status) => {
    const entry = {
      id: `${item.id}-${Date.now()}`,
      approvalId: item.id,
      decision,
      status,
      amount: item.amount,
      timestamp: new Date().toISOString()
    };

    setAuditLog((current) => [entry, ...current].slice(0, 50));
  }, []);

  const resolveLocally = useCallback((item, decision, status = 'preview') => {
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    recordAction(item, decision, status);
  }, [recordAction]);

  const resolveWithEdge = useCallback(async (item, decision) => {
    const edgeUrl = import.meta.env.VITE_CFO_EDGE_URL || '';

    if (!item.token || !edgeUrl) {
      resolveLocally(item, decision, 'preview');
      return { success: true, message: `Preview action recorded. Connect the edge worker to execute ${decision}.` };
    }

    // Optimistic update
    setItems((current) => current.filter((entry) => entry.id !== item.id));

    try {
      const query = new URLSearchParams({
        token: item.token,
        decision
      });
      const response = await fetch(
        `${edgeUrl}/api/v1/hitl-resolve?${query}`
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Approval could not be resolved');
      }

      recordAction(item, decision, 'executed');
      return { success: true, message: `${item.id} resolved securely.` };
    } catch (err) {
      // Revert optimistic update
      setItems((current) => {
        // Insert back at the beginning
        return [item, ...current];
      });

      // Trigger error boundary
      setError(err instanceof Error ? err : new Error('Approval request failed.'));
      return { success: false };
    }
  }, [resolveLocally, recordAction]);

  const removeItem = useCallback((item) => {
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    recordAction(item, 'dismiss', 'preview');
  }, [recordAction]);

  const restoreDefaults = useCallback(() => {
    setItems(initialApprovals);
    setAuditLog([]);
  }, []);

  return {
    items,
    auditLog,
    resolveLocally,
    resolveWithEdge,
    removeItem,
    recordAction,
    restoreDefaults
  };
}