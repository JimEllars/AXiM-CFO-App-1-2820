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

let currentMetrics = { ...defaultMetrics };

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

function updateMetrics(payload: WebhookPayload): void {
  const next = { ...currentMetrics };

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
  currentMetrics = next;
}

function handleMetrics(
  request: Request,
  env: Env
): Response {
  return jsonResponse(request, env, {
    ...currentMetrics,
    source: 'cfo-edge-worker'
  });
}

async function handleSignedWebhook(
  request: Request,
  env: Env,
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
  updateMetrics(payload);

  const results: Record<string, unknown> = {
    accepted: true,
    event: eventName,
    empty: Object.keys(payload).length === 0
  };

  if (routeCrm && Object.keys(payload).length > 0) {
    results.crm = await routeCrmPayload(payload, env);
  }

  results.coreSynced = await pushToCore(eventName, payload, env);

  return jsonResponse(request, env, results, 202);
}

function handleMetricsStream(
  request: Request,
  env: Env
): Response {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const publish = () => {
        if (closed) return;

        try {
          const message = [
            'event: metrics',
            `data: ${JSON.stringify(currentMetrics)}`,
            '',
            ''
          ].join('\n');

          controller.enqueue(encoder.encode(message));
        } catch {
          closed = true;
          if (timer) clearInterval(timer);
        }
      };

      controller.enqueue(encoder.encode('retry: 5000\n\n'));
      publish();
      timer = setInterval(publish, 5000);
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
      return handleMetricsStream(request, env);
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