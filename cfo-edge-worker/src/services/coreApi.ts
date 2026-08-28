import type { Env, WebhookPayload } from '../types';

export async function pushToCore(
  eventName: string,
  payload: WebhookPayload,
  env: Env
): Promise<boolean> {
  if (!env.AXIM_CORE_API_URL || !env.AXIM_CORE_API_TOKEN) {
    console.warn('core_sync_not_configured', { eventName });
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(env.AXIM_CORE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AXIM_CORE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-AXiM-Department': 'cfo'
      },
      body: JSON.stringify({
        event: eventName,
        department: 'cfo',
        occurredAt: new Date().toISOString(),
        payload
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error('core_sync_failed', {
        eventName,
        status: response.status
      });
    }

    return response.ok;
  } catch (error) {
    console.error('core_sync_error', {
      eventName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  } finally {
    clearTimeout(timeout);
  }
}