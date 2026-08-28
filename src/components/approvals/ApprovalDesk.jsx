import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useApprovalQueue } from '../../hooks/useApprovalQueue';

const {
  FiCheck,
  FiClock,
  FiExternalLink,
  FiLoader,
  FiShield,
  FiX
} = FiIcons;



function ApprovalDesk({ compact = false }) {
  const {
    items,
    resolveLocally,
    resolveWithEdge,
    removeItem
  } = useApprovalQueue();
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  const resolveItem = async (item, decision) => {
    setBusyId(item.id);
    setMessage('');

    const result = await resolveWithEdge(item, decision);
    if (result.success && result.message) {
      setMessage(result.message);
    }

    setBusyId('');
  };

  const visibleItems = items.slice(0, compact ? 2 : items.length);

  return (
    <section className="panel approval-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Human-in-the-loop</span>
          <h2>Approval desk</h2>
        </div>
        <span className="queue-chip">{items.length} pending</span>
      </div>

      {message && <p className="approval-message">{message}</p>}

      <div className="approval-list">
        <AnimatePresence>
          {visibleItems.map((item) => {
            const isBusy = busyId === item.id;

            return (
              <motion.article
                className="approval-item"
                key={item.id}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="approval-icon">
                  <SafeIcon icon={FiShield} />
                </div>

                <div className="approval-content">
                  <div className="approval-title">
                    <strong>{item.type}</strong>
                    <span className={`risk ${item.risk.toLowerCase()}`}>
                      {item.risk} risk
                    </span>
                  </div>
                  <p>{item.detail}</p>
                  <span className="approval-time">
                    <SafeIcon icon={FiClock} />
                    {item.id} · {item.requested}
                  </span>
                </div>

                <strong className="approval-amount">{item.amount}</strong>

                <div className="approval-actions">
                  <button
                    className="approve-button"
                    disabled={isBusy}
                    onClick={() => resolveItem(item, 'approve')}
                  >
                    <SafeIcon icon={isBusy ? FiLoader : FiCheck} />
                    {isBusy ? 'Working' : 'Approve'}
                  </button>
                  <button
                    className="review-button"
                    disabled={isBusy}
                    onClick={() => resolveItem(item, 'review')}
                  >
                    <SafeIcon icon={FiExternalLink} />
                    Review
                  </button>
                  <button
                    className="dismiss-button"
                    disabled={isBusy}
                    aria-label={`Dismiss ${item.id}`}
                    onClick={() => {
                      removeItem(item);
                      setMessage(`${item.id} dismissed from this browser.`);
                    }}
                  >
                    <SafeIcon icon={FiX} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {!items.length && (
          <div className="empty-state">
            All financial gates are clear.
          </div>
        )}
      </div>
    </section>
  );
}

export default ApprovalDesk;