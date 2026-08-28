import type { KVNamespace, Queue } from '@cloudflare/workers-types';
export interface Env {
  AXIM_CORE_SECRET: string;
  AXIM_CORE_API_URL?: string;
  AXIM_CORE_API_TOKEN?: string;
  ALLOWED_ORIGINS: string;
  EMAIL_FROM: string;
  EMAILIT_API_KEY: string;
  EMAILIT_API_URL: string;
  RESEND_API_KEY: string;
  RESEND_API_URL: string;
  NEXUS_CRM_URL?: string;
  NEXUS_CRM_TOKEN?: string;
  SUITEDASH_API_URL?: string;
  SUITEDASH_API_TOKEN?: string;
  HITL_APPROVAL_BASE_URL: string;
  METRICS_CACHE: KVNamespace;
  CFO_AUDIT_CACHE: KVNamespace;
  WEBHOOK_QUEUE: Queue;
}

export interface CommissionTier {
  channel: string;
  bracket: number;
  accrued: number;
  status: string;
}

export interface FinancialMetrics {
  commissionTiers?: CommissionTier[];
  grossRevenue: number;
  affiliatePayouts: number;
  fixedOpex: number;
  netContributionMargin: number;
  assessments: number;
  updatedAt: string;
}

export interface WebhookPayload {
  type?: string;
  source?: string;
  category?: string;
  value?: number;
  grossRevenue?: number;
  affiliatePayouts?: number;
  fixedOpex?: number;
  assessments?: number;
  commissionTiers?: CommissionTier[];
  [key: string]: unknown;
}
