import React from 'react';
import { yieldRows } from '../../data/financialData';

function YieldTracker() {
  return (
    <section className="panel yield-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Unit economics</span>
          <h2>Funnel yield tracker</h2>
        </div>
        <span className="panel-meta">Per 1,000 assessments</span>
      </div>

      <div className="yield-list">
        {yieldRows.map((row) => (
          <div className="yield-row" key={row.product}>
            <span className="tier-tag">{row.tier}</span>
            <div className="yield-product">
              <strong>{row.product}</strong>
              <span>{row.averageOrder} average · {row.conversion} CVR</span>
            </div>
            <div className="yield-value">
              <strong>{row.yield}</strong>
              <span>{row.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default YieldTracker;