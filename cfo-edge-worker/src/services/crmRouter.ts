import type { Env, WebhookPayload } from '../types';

type Destination = 'nexus' | 'suitedash';

export interface CrmRouteResult {
  destination: Destination;
  delivered: boolean;
  status?: number;
  error?: string;
}

function chooseDestination(payload: WebhookPayload): Destination {
  const searchable = [
    payload.type,
    payload.category,
    payload.source,
    payload.pipeline,
    payload.department
  ].filter(Boolean).join(' ').toLowerCase();

  const internalSignals = [
    'high-ticket',
    'coaching',
    'b2b',
    'internal',
    'enterprise',
    'nexus'
  ];

  return internalSignals.some((signal) => searchable.includes(signal))
    ? 'nexus'
    : 'suitedash';
}

import type { ExecutionContext } from '@cloudflare/workers-types';

export async function routeCrmPayload(
  payload: WebhookPayload,
  env: Env,
  ctx: ExecutionContext
): Promise<CrmRouteResult> {
  const destination = chooseDestination(payload);
  ctx.waitUntil(Promise.resolve(console.log(`[CRM Routing] Routed to ${destination === 'nexus' ? 'Nexus CRM' : 'SuiteDash'} based on payload`, { type: payload.type, category: payload.category })));
  const url = destination === 'nexus'
    ? env.NEXUS_CRM_URL
    : env.SUITEDASH_API_URL;
  const token = destination === 'nexus'
    ? env.NEXUS_CRM_TOKEN
    : env.SUITEDASH_API_TOKEN;

  if (!url || !token) {
    ctx.waitUntil(Promise.resolve(console.warn('crm_route_not_configured', { destination })));
    return { destination, delivered: false, error: 'not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-AXiM-Source': 'cfo-edge-worker'
      },
      body: JSON.stringify({
        ...payload,
        routedAt: new Date().toISOString(),
        routedBy: 'cfo-edge-worker'
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      ctx.waitUntil(Promise.resolve(console.error('crm_route_failed', {
        destination,
        status: response.status
      })));
    }

    return {
      destination,
      delivered: response.ok,
      status: response.status,
      error: response.ok ? undefined : 'provider_rejected'
    };
  } catch (error) {
    ctx.waitUntil(Promise.resolve(console.error('crm_route_error', {
      destination,
      error: error instanceof Error ? error.message : 'Unknown error'
    })));

    return {
      destination,
      delivered: false,
      error: 'provider_unavailable'
    };
  } finally {
    clearTimeout(timeout);
  }
}