import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiArrowDownRight, FiArrowUpRight } = FiIcons;

function MetricCard({ label, value, change, note, accent = false, delay = 0 }) {
  const positive = !change.startsWith('-');

  return (
    <motion.article
      className={`metric-card p-5 rounded-xl border border-[rgba(202,236,221,0.1)] bg-[rgba(255,255,255,0.02)] shadow-sm ${accent ? 'accent ring-1 ring-[var(--mint)]' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="metric-heading flex justify-between items-center mb-3 text-sm text-[var(--muted)] font-medium tracking-wide">
        <span>{label}</span>
        <span className={`metric-change flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${positive ? 'bg-[rgba(82,214,161,0.1)] text-[var(--mint)]' : 'bg-[rgba(255,141,131,0.1)] text-[#ff8d83]'}`}>
          <SafeIcon icon={positive ? FiArrowUpRight : FiArrowDownRight} />
          {change}
        </span>
      </div>
      <strong className="metric-value text-2xl font-semibold tracking-tight text-white mb-1 block">{value}</strong>
      <p className="text-xs text-[var(--muted)] mt-2">{note}</p>
    </motion.article>
  );
}

export default MetricCard;