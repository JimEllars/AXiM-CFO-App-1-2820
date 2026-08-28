import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ApprovalDesk from '../components/approvals/ApprovalDesk';
import CommissionTable from '../components/dashboard/CommissionTable';
import MarginGauge from '../components/dashboard/MarginGauge';
import MetricCard from '../components/dashboard/MetricCard';
import TreasuryPanel from '../components/dashboard/TreasuryPanel';
import YieldTracker from '../components/dashboard/YieldTracker';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

function CFODashboard() {
  const { metrics } = useOutletContext();

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Financial command center</span>
          <h1>Executive overview</h1>
          <p>Real-time capital efficiency, unit economics, and treasury controls.</p>
        </div>
        <div className="period-selector">
          <span>Reporting window</span>
          <strong>Current funnel cycle</strong>
        </div>
      </div>

      <section className="metric-grid">
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

      <div className="dashboard-grid">
        <MarginGauge value={metrics.netContributionMargin} />
        <YieldTracker />
        <CommissionTable />
        <TreasuryPanel />
      </div>

      <ApprovalDesk compact />
    </>
  );
}

export default CFODashboard;