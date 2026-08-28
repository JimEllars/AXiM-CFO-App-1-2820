import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

function CommissionTable() {
  const { metrics } = useOutletContext();
  const [highlightRow, setHighlightRow] = useState(null);

  useEffect(() => {
    if (metrics.commissionTiers) {
      setHighlightRow('all');
      const timer = setTimeout(() => setHighlightRow(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [metrics.updatedAt]);

  const tiers = metrics.commissionTiers || [];

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Distribution controls</span>
          <h2>Commission architecture</h2>
        </div>
        <span className="panel-meta">$312 accrued</span>
      </div>

      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Bracket</th>
              <th>Accrued</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((row) => (
              <tr key={row.channel} className={highlightRow === 'all' ? 'bg-emerald-500/10 transition-colors duration-500' : 'transition-colors duration-1000'}>
                <td>{row.channel}</td>
                <td>
                  {row.bracket}%
                </td>
                <td>${row.accrued}</td>
                <td>
                  <span className={`status-chip ${row.status.toLowerCase()}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default CommissionTable;