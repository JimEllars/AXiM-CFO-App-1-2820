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

function getDecisionColors(decision) {
  switch (decision.toLowerCase()) {
    case 'approve':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'review':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'reject':
    case 'dismiss':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    case 'automated':
    case 'automated margin warning':
    case 'margin warning':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'overridden':
    case 'human-overridden':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
}

function getStatusColors(status) {
  switch (status.toLowerCase()) {
    case 'executed':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'preview':
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
}

function AuditLog({ entries }) {
  return (
    <section className="mt-8 bg-[#1e2321] rounded-xl border border-white/5 overflow-hidden shadow-lg">
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <div>
          <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider">Governance record</span>
          <h2 className="text-xl font-medium text-white mt-1">Decision history</h2>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 text-lime-400 border border-lime-400/20 rounded-lg hover:bg-lime-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          type="button"
          disabled={!entries.length}
          onClick={() => downloadCsv(entries)}
        >
          <SafeIcon icon={FiDownload} />
          Export CSV
        </button>
      </div>

      {!entries.length ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
          <SafeIcon icon={FiFileText} className="w-5 h-5" />
          No approval actions have been recorded yet.
        </div>
      ) : (
        <div className="grid gap-[1px] bg-white/5">
          {entries.map((entry) => (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-4 md:gap-8 p-4 md:p-5 bg-[#1e2321] hover:bg-white/[0.02] transition-colors" key={entry.id}>
              <div className="flex flex-col gap-1">
                <strong className="text-sm font-medium text-white">{entry.approvalId}</strong>
                <span className="text-xs text-slate-400">{formatTimestamp(entry.timestamp)}</span>
              </div>

              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium ${getDecisionColors(entry.decision)}`}>
                  {entry.decision}
                </span>
              </div>

              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium ${getStatusColors(entry.status)}`}>
                  {entry.status}
                </span>
              </div>

              <div className="text-right">
                <strong className="text-sm font-medium text-slate-300">{entry.amount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AuditLog;
