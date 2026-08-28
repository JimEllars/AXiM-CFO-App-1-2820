export const targetMargin = 77.6;

export const defaultMetrics = {
  grossRevenue: 2065,
  affiliatePayouts: 312,
  fixedOpex: 150,
  netContributionMargin: 77.6,
  assessments: 1000,
  updatedAt: new Date().toISOString()
};

export const yieldRows = [
  {
    tier: 'Tier 2',
    product: 'AI Growth Plan',
    averageOrder: '$12',
    conversion: '8.0%',
    yield: '$960',
    trend: '+1.4%'
  },
  {
    tier: 'Tier 3',
    product: 'Deep-Dive Playbooks',
    averageOrder: '$29',
    conversion: '2.7%',
    yield: '$783',
    trend: '+0.8%'
  },
  {
    tier: 'Referral',
    product: 'Coach / Consultant',
    averageOrder: '$60',
    conversion: '0.54%',
    yield: '$322',
    trend: '+2.2%'
  }
];

export const commissionRows = [
  { channel: 'Print-on-Demand', bracket: 10, accrued: 48, status: 'Healthy' },
  { channel: 'Coaching Referrals', bracket: 20, accrued: 96, status: 'Healthy' },
  { channel: 'Bundled Digital', bracket: 25, accrued: 73, status: 'Review' },
  { channel: 'Standalone Digital Packs', bracket: 35, accrued: 95, status: 'Healthy' }
];

export const treasuryChecks = [
  { name: 'Digital goods MCC', value: '5818', status: 'Active' },
  { name: 'Coaching MCC', value: '8299', status: 'Active' },
  { name: 'Processor holds', value: '$0', status: 'Clear' },
  { name: 'High-risk reserves', value: '0.0%', status: 'Clear' },
  { name: 'Selldone seats', value: '$0 MRR', status: 'Efficient' }
];

export const initialApprovals = [
  {
    id: 'PAY-2025-041',
    type: 'Affiliate payout batch',
    amount: '$12,480',
    detail: '87 partner disbursements · April cycle',
    risk: 'Low',
    requested: '8 min ago',
    token: null
  },
  {
    id: 'MARGIN-2025-009',
    type: 'Margin threshold response',
    amount: '76.9%',
    detail: 'Bundled Digital fell 0.7 pts below target',
    risk: 'Medium',
    requested: '22 min ago',
    token: null
  }
];