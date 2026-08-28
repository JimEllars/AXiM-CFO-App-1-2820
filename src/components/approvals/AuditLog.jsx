import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiDownload, FiFileText } = FiIcons;

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function downloadCsv(entries) {
  const headers = ['Approval ID', 'Decision', 'Status', 'Amount', 'Timestamp'];
  const rows = entries.map((entry) => [
    entry.approvalId,
    entry.decision,
    entry.status,
    entry.amount,
    entry.timestamp
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `axim-cfo-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function AuditLog({ entries }) {
  return (
    <section className="panel audit-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Governance record</span>
          <h2>Decision history</h2>
        </div>
        <button
          className="export-button"
          type="button"
          disabled={!entries.length}
          onClick={() => downloadCsv(entries)}
        >
          <SafeIcon icon={FiDownload} />
          Export CSV
        </button>
      </div>

      {!entries.length ? (
        <div className="empty-state">
          <SafeIcon icon={FiFileText} />
          No approval actions have been recorded yet.
        </div>
      ) : (
        <div className="audit-list">
          {entries.map((entry) => (
            <div className="audit-row" key={entry.id}>
              <div>
                <strong>{entry.approvalId}</strong>
                <span>{formatTimestamp(entry.timestamp)}</span>
              </div>
              <span className={`audit-decision ${entry.decision}`}>
                {entry.decision}
              </span>
              <span className={`audit-status ${entry.status}`}>
                {entry.status}
              </span>
              <strong>{entry.amount}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AuditLog;