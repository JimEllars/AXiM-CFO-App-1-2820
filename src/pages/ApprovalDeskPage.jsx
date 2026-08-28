import React from 'react';
import ApprovalDesk from '../components/approvals/ApprovalDesk';
import AuditLog from '../components/approvals/AuditLog';
import { useApprovalQueue } from '../hooks/useApprovalQueue';

function ApprovalDeskPage() {
  const { auditLog } = useApprovalQueue();

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Controlled execution</span>
          <h1>HITL approval desk</h1>
          <p>
            Review payout releases and margin interventions before execution.
          </p>
        </div>
        <div className="security-state">
          <span /> HMAC-secured action links
        </div>
      </div>

      <ApprovalDesk />
      <AuditLog entries={auditLog} />
    </>
  );
}

export default ApprovalDeskPage;