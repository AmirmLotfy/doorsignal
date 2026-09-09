import crypto from 'node:crypto';

export interface VerifyRingWebhookParams {
  rawBody: string;
  signatureHeader: string; // e.g., "t=1757464034,v1=9b7348e..."
  webhookSecret: string;
  maxClockDriftSeconds?: number;
}

export interface VerifyRingWebhookResult {
  isValid: boolean;
  reason?: string;
  timestamp?: number;
}

export function generateRingWebhookSignature(
  rawBody: string,
  webhookSecret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signatureHeader: string; timestamp: number } {
  const signedPayload = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
  return {
    signatureHeader: `t=${timestamp},v1=${hmac}`,
    timestamp
  };
}

export function verifyRingWebhookSignature({
  rawBody,
  signatureHeader,
  webhookSecret,
  maxClockDriftSeconds = 300 // 5 minutes
}: VerifyRingWebhookParams): VerifyRingWebhookResult {
  if (!signatureHeader) {
    return { isValid: false, reason: 'Missing X-Ring-Signature header' };
  }

  const parts = signatureHeader.split(',');
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      signature = value;
    }
  }

  if (!timestamp || isNaN(timestamp) || !signature) {
    return { isValid: false, reason: 'Malformed signature header format' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxClockDriftSeconds) {
    return { 
      isValid: false, 
      reason: `Clock drift exceeded limit (${Math.abs(now - timestamp)}s > ${maxClockDriftSeconds}s)`,
      timestamp 
    };
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { isValid: false, reason: 'Signature length mismatch', timestamp };
  }

  const matches = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!matches) {
    return { isValid: false, reason: 'HMAC signature verification failed', timestamp };
  }

  return { isValid: true, timestamp };
}
