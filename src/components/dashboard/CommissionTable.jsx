import React from 'react';
import { commissionRows } from '../../data/financialData';

function CommissionTable() {
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
            {commissionRows.map((row) => (
              <tr key={row.channel}>
                <td>{row.channel}</td>
                <td>
                  <span className="bracket">{row.bracket}%</span>
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