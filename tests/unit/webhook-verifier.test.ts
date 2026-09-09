import { describe, it, expect } from 'vitest';
import { 
  generateRingWebhookSignature, 
  verifyRingWebhookSignature 
} from '../../packages/ring-client/src/webhook-crypto.js';

describe('Ring Webhook Signature Verification', () => {
  const secret = 'super_secret_webhook_key_123';
  const body = JSON.stringify({
    event_id: 'evt_test_100',
    device_id: 'ring_dev_front_door_01',
    event_type: 'button_press',
    created_at: new Date().toISOString()
  });

  it('successfully verifies a valid HMAC-SHA256 signature', () => {
    const { signatureHeader } = generateRingWebhookSignature(body, secret);
    const result = verifyRingWebhookSignature({
      rawBody: body,
      signatureHeader,
      webhookSecret: secret
    });

    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects a signature generated with the wrong secret', () => {
    const { signatureHeader } = generateRingWebhookSignature(body, 'wrong_secret');
    const result = verifyRingWebhookSignature({
      rawBody: body,
      signatureHeader,
      webhookSecret: secret
    });

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('HMAC signature verification failed');
  });

  it('rejects a tampered body payload', () => {
    const { signatureHeader } = generateRingWebhookSignature(body, secret);
    const tamperedBody = body.replace('button_press', 'tampered_event');
    const result = verifyRingWebhookSignature({
      rawBody: tamperedBody,
      signatureHeader,
      webhookSecret: secret
    });

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('HMAC signature verification failed');
  });

  it('rejects an expired timestamp beyond maximum clock drift', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400s ago (> 300s limit)
    const { signatureHeader } = generateRingWebhookSignature(body, secret, oldTimestamp);
    const result = verifyRingWebhookSignature({
      rawBody: body,
      signatureHeader,
      webhookSecret: secret,
      maxClockDriftSeconds: 300
    });

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Clock drift exceeded limit');
  });
});
