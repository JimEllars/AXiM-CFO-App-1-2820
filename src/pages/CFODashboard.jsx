import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ApprovalDesk from '../components/approvals/ApprovalDesk';
import CommissionTable from '../components/dashboard/CommissionTable';
import MarginGauge from '../components/dashboard/MarginGauge';
import MetricCard from '../components/dashboard/MetricCard';
import TreasuryPanel from '../components/dashboard/TreasuryPanel';
import YieldTracker from '../components/dashboard/YieldTracker';
import ErrorBoundary from '../components/layout/ErrorBoundary';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function CFODashboard() {
  const { metrics } = useOutletContext();

  return (
    <>
      <div className="page-heading flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <span className="eyebrow text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2 block">Financial command center</span>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Executive overview</h1>
          <p className="text-sm text-[var(--muted)]">Real-time capital efficiency, unit economics, and treasury controls.</p>
        </div>
        <div className="period-selector flex flex-col items-end text-right p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(202,236,221,0.08)]">
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Reporting window</span>
          <strong className="text-sm text-[var(--mint)]">Current funnel cycle</strong>
        </div>
      </div>

      <section className="metric-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Gross funnel revenue"
          value={currency.format(metrics.grossRevenue)}
          change="+12.4%"
          note={`Baseline per ${metrics.assessments.toLocaleString()} assessments`}
          delay={0.05}
        />
        <MetricCard
          label="Affiliate payouts"
          value={currency.format(metrics.affiliatePayouts)}
          change="+3.2%"
          note="15.1% of gross funnel revenue"
          delay={0.1}
        />
        <MetricCard
          label="Fixed Opex"
          value={currency.format(metrics.fixedOpex)}
          change="-4.0%"
          note="Selldone enterprise license optimized"
          delay={0.15}
        />
        <MetricCard
          label="Net contribution"
          value={`${Number(metrics.netContributionMargin).toFixed(1)}%`}
          change="+0.0 pts"
          note="Aligned with the 77.6% target"
          accent
          delay={0.2}
        />
      </section>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ErrorBoundary><MarginGauge value={metrics.netContributionMargin} /></ErrorBoundary>
        <ErrorBoundary><YieldTracker /></ErrorBoundary>
        <CommissionTable />
        <TreasuryPanel />
      </div>

      <ApprovalDesk compact />
    </>
  );
}

export default CFODashboard;