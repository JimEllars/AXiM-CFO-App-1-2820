import React from 'react';
import { motion } from 'framer-motion';
import { targetMargin } from '../../data/financialData';

function MarginGauge({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value)));
  const degrees = safeValue * 3.6;

  return (
    <section className="panel margin-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">North Star control</span>
          <h2>Contribution margin</h2>
        </div>
        <span className="healthy-chip">On target</span>
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