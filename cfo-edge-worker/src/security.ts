const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return toHex(await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  ));
}

function encodeToken(value: string): string {
  return btoa(value)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function decodeToken(value: string): string {
  const normalized = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return atob(normalized);
}

export async function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const supplied = signatureHeader
    .replace(/^sha256=/i, '')
    .toLowerCase();

  const expected = await sign(body, secret);
  return constantTimeEqual(expected, supplied);
}

export async function createHitlToken(
  action: string,
  resourceId: string,
  secret: string,
  ttlSeconds = 900
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = JSON.stringify({ action, resourceId, expiresAt });
  const signature = await sign(payload, secret);

  return encodeToken(`${payload}.${signature}`);
}

export async function verifyHitlToken(
  token: string,
  secret: string
): Promise<{ action: string; resourceId: string; expiresAt: number } | null> {
  try {
    const decoded = decodeToken(token);
    const separatorIndex = decoded.lastIndexOf('.');

    if (separatorIndex < 1) return null;

    const payload = decoded.slice(0, separatorIndex);
    const suppliedSignature = decoded.slice(separatorIndex + 1);
    const expectedSignature = await sign(payload, secret);

    if (!constantTimeEqual(expectedSignature, suppliedSignature)) {
      return null;
    }

    const parsed = JSON.parse(payload) as {
      action?: unknown;
      resourceId?: unknown;
      expiresAt?: unknown;
    };

    if (
      typeof parsed.action !== 'string' ||
      typeof parsed.resourceId !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      action: parsed.action,
      resourceId: parsed.resourceId,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}