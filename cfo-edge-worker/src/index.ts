import { routeCrmPayload } from './services/crmRouter';
import { pushToCore } from './services/coreApi';
import { verifyHitlToken, verifyWebhookSignature } from './security';
import type { Env, FinancialMetrics, WebhookPayload } from './types';
import type { ExecutionContext } from '@cloudflare/workers-types';

const defaultMetrics: FinancialMetrics = {
  grossRevenue: 2065,
  affiliatePayouts: 312,
  fixedOpex: 150,
  netContributionMargin: 77.6,
  assessments: 1000,
  updatedAt: new Date().toISOString()
};

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const allowed = env.ALLOWED_ORIGINS
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-AXiM-Signature, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  });

  const origin = allowedOrigin(request, env);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return headers;
}

function jsonResponse(
  request: Request,
  env: Env,
  body: unknown,
  status = 200
): Response {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');

  return new Response(JSON.stringify(body), { status, headers });
}

function safePayload(body: string): WebhookPayload {
  if (!body.trim()) return {};

  try {
    const parsed = JSON.parse(body);

    return parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? parsed as WebhookPayload
      : {};
  } catch {
    return {};
  }
}

async function updateMetrics(payload: WebhookPayload, env: Env): Promise<void> {
  let current = { ...defaultMetrics };
  try {
    const cached = await env.METRICS_CACHE.get('currentMetrics', 'json') as FinancialMetrics | null;
    if (cached) {
      current = cached;
    }
  } catch {}

  const next = { ...current };

  for (const key of [
    'grossRevenue',
    'affiliatePayouts',
    'fixedOpex',
    'assessments'
  ] as const) {
    const value = payload[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      next[key] = value;
    }
  }

  const contribution = next.grossRevenue
    - next.affiliatePayouts
    - next.fixedOpex;

  next.netContributionMargin = next.grossRevenue > 0
    ? Number(((contribution / next.grossRevenue) * 100).toFixed(1))
    : 0;
  next.updatedAt = new Date().toISOString();

  try {
    await env.METRICS_CACHE.put('currentMetrics', JSON.stringify(next), { expirationTtl: 60 * 60 * 24 }); // Cache for 24h as fallback if no webhooks
  } catch {}
}

async function handleMetrics(
  request: Request,
  env: Env
): Promise<Response> {
  let metrics = { ...defaultMetrics };
  try {
    const cached = await env.METRICS_CACHE.get('currentMetrics', 'json') as FinancialMetrics | null;
    if (cached) {
      metrics = cached;
    }
  } catch {
    // Ignore KV error
  }
  return jsonResponse(request, env, {
    ...metrics,
    source: 'cfo-edge-worker'
  });
}

async function handleSignedWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  eventName: string,
  routeCrm = false
): Promise<Response> {
  const rawBody = await request.text();

  // Track payload integrity observability natively
  console.log(`[Webhook Received] Event: ${eventName}`, {
    contentLength: rawBody.length,
    timestamp: new Date().toISOString()
  });

  const valid = await verifyWebhookSignature(
    rawBody,
    request.headers.get('X-AXiM-Signature'),
    env.AXIM_CORE_SECRET
  );

  if (!valid) {
    return jsonResponse(
      request,
      env,
      { error: 'Invalid webhook signature' },
      401
    );
  }

  const payload = safePayload(rawBody);
  await updateMetrics(payload, env);

  const results: Record<string, unknown> = {
    accepted: true,
    event: eventName,
    empty: Object.keys(payload).length === 0
  };

  if (routeCrm && Object.keys(payload).length > 0) {
    results.crm = await routeCrmPayload(payload, env, ctx);
  }

  results.coreSynced = await pushToCore(eventName, payload, env);

  return jsonResponse(request, env, results, 202);
}

function handleMetricsStream(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Response {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const publish = async () => {
        if (closed) return;

        try {
          let metrics = { ...defaultMetrics };
          try {
            const cached = await env.METRICS_CACHE.get('currentMetrics', 'json') as FinancialMetrics | null;
            if (cached) {
              metrics = cached;
            }
          } catch {
            // fallback to default
          }
          const message = [
            'event: metrics',
            `data: ${JSON.stringify(metrics)}`,
            '',
            ''
          ].join('\n');

          controller.enqueue(encoder.encode(message));
        } catch {
          closed = true;
          if (timer) clearInterval(timer);
        }
      };

      controller.enqueue(encoder.encode('retry: 15000\n\n'));
      ctx.waitUntil(publish());
      timer = setInterval(() => ctx.waitUntil(publish()), 15000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    }
  });

  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');
  headers.set('X-Accel-Buffering', 'no');

  return new Response(stream, { headers });
}

async function tokenWasUsed(token: string): Promise<boolean> {
  const cacheKey = new Request(
    `https://hitl-token.internal/${encodeURIComponent(token)}`
  );

  return Boolean(await (caches as any).default.match(cacheKey));
}

async function markTokenUsed(
  token: string,
  expiresAt: number
): Promise<void> {
  const cacheKey = new Request(
    `https://hitl-token.internal/${encodeURIComponent(token)}`
  );
  const maxAge = Math.max(
    1,
    expiresAt - Math.floor(Date.now() / 1000)
  );

  await (caches as any).default.put(
    cacheKey,
    new Response('used', {
      headers: { 'Cache-Control': `public, max-age=${maxAge}` }
    })
  );
}

async function handleHitlResolve(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const decision = url.searchParams.get('decision') || 'approve';

  if (!['approve', 'review', 'reject'].includes(decision)) {
    return jsonResponse(
      request,
      env,
      { error: 'Unsupported HITL decision' },
      400
    );
  }

  const tokenData = await verifyHitlToken(token, env.AXIM_CORE_SECRET);

  if (!tokenData) {
    return jsonResponse(
      request,
      env,
      { error: 'Invalid or expired HITL token' },
      401
    );
  }

  if (await tokenWasUsed(token)) {
    return jsonResponse(
      request,
      env,
      { error: 'HITL token has already been used' },
      409
    );
  }

  await markTokenUsed(token, tokenData.expiresAt);

  const coreSynced = await pushToCore(
    'cfo.hitl.resolved',
    {
      action: tokenData.action,
      resourceId: tokenData.resourceId,
      decision
    },
    env
  );

  return jsonResponse(request, env, {
    resolved: true,
    decision,
    resourceId: tokenData.resourceId,
    coreSynced
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');

      if (origin && !allowedOrigin(request, env)) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    if (
      request.headers.get('Origin') &&
      !allowedOrigin(request, env)
    ) {
      return jsonResponse(
        request,
        env,
        { error: 'Origin is not allowed' },
        403
      );
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/api/v1/metrics'
    ) {
      return handleMetrics(request, env);
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/api/v1/stream/metrics'
    ) {
      return handleMetricsStream(request, env, ctx);
    }

    if (
      ['GET', 'POST'].includes(request.method) &&
      url.pathname === '/api/v1/hitl-resolve'
    ) {
      return handleHitlResolve(request, env);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/v1/core-webhook'
    ) {
      return handleSignedWebhook(
        request,
        env,
        ctx,
        'cfo.core.webhook'
      );
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/v1/selldone-ingest'
    ) {
      return handleSignedWebhook(
        request,
        env,
        ctx,
        'cfo.selldone.ingested',
        true
      );
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/api/v1/health'
    ) {
      return jsonResponse(request, env, {
        status: 'healthy',
        service: 'cfo-edge-worker',
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse(
      request,
      env,
      { error: 'Route not found' },
      404
    );
  }
};