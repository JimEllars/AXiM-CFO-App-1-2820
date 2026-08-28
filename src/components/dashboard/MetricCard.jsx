import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiArrowDownRight, FiArrowUpRight } = FiIcons;

function MetricCard({ label, value, change, note, accent = false, delay = 0 }) {
  const positive = !change.startsWith('-');

  return (
    <motion.article
      className={`metric-card ${accent ? 'accent' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="metric-heading">
        <span>{label}</span>
        <span className={`metric-change ${positive ? 'positive' : 'negative'}`}>
          <SafeIcon icon={positive ? FiArrowUpRight : FiArrowDownRight} />
          {change}
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <p>{note}</p>
    </motion.article>
  );
}

export default MetricCard;