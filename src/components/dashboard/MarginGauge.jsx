import React from 'react';
import { motion } from 'framer-motion';
import { targetMargin } from '../../data/financialData';

function MarginGauge({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value)));
  const degrees = safeValue * 3.6;

  return (
    <section className="panel margin-panel p-6 rounded-2xl border border-[rgba(202,236,221,0.1)] bg-[rgba(255,255,255,0.02)] shadow-md flex flex-col gap-6">
      <div className="panel-heading flex justify-between items-start">
        <div>
          <span className="eyebrow text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-1 block">North Star control</span>
          <h2 className="text-lg font-semibold text-white">Contribution margin</h2>
        </div>
        <span className="healthy-chip text-xs font-semibold px-3 py-1 bg-[rgba(82,214,161,0.1)] text-[var(--mint)] rounded-full">On target</span>
      </div>

      <div className="gauge-layout">
        <motion.div
          className="gauge"
          initial={{ '--gauge-value': '0deg' }}
          animate={{ '--gauge-value': `${degrees}deg` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="gauge-center">
            <strong>{safeValue.toFixed(1)}%</strong>
            <span>current</span>
          </div>
        </motion.div>
        <div className="margin-summary">
          <div>
            <span>Target floor</span>
            <strong>{targetMargin}%</strong>
          </div>
          <div>
            <span>Variance</span>
            <strong className="lime">+0.0 pts</strong>
          </div>
          <p>Automated controls monitor funnel contribution after commissions and fixed operating costs.</p>
        </div>
      </div>
    </section>
  );
}

export default MarginGauge;