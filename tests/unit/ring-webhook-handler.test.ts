import { describe, it, expect } from 'vitest';
import { handleRingWebhook } from '../../services/ring-webhooks/src/handler.js';
import { generateRingWebhookSignature } from '../../packages/ring-client/src/webhook-crypto.js';

describe('Ring Webhook Ingestion Handler QA', () => {
  const secret = 'ds_ring_webhook_secret_dev_key';

  it('accepts a valid button_press webhook and routes to door.button.pressed', async () => {
    const payload = JSON.stringify({
      event_id: `evt_qa_btn_${Date.now()}`,
      device_id: 'ring_dev_front_door_01',
      event_type: 'button_press',
      created_at: new Date().toISOString(),
      data: { ring_doorbell_model: 'Video Doorbell Pro 2' }
    });

    const { signatureHeader } = generateRingWebhookSignature(payload, secret);

    const response = await handleRingWebhook({
      headers: {
        'x-ring-signature': signatureHeader,
        'x-ring-request-id': `req_qa_${Date.now()}`
      },
      body: payload
    }, secret);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('accepted');
    expect(body.topic).toBe('door.button_pressed');
  });

  it('accepts a valid package_detected webhook and routes to door.package.detected', async () => {
    const payload = JSON.stringify({
      event_id: `evt_qa_pkg_${Date.now()}`,
      device_id: 'ring_dev_dock_02',
      event_type: 'package_detected',
      created_at: new Date().toISOString(),
      data: { box_count: 1 }
    });

    const { signatureHeader } = generateRingWebhookSignature(payload, secret);

    const response = await handleRingWebhook({
      headers: {
        'X-Ring-Signature': signatureHeader,
        'X-Ring-Request-Id': `req_pkg_${Date.now()}`
      },
      body: payload
    }, secret);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('accepted');
    expect(body.topic).toBe('door.package_detected');
  });

  it('rejects duplicate webhook requests idempotently (replay prevention)', async () => {
    const payload = JSON.stringify({
      event_id: `evt_qa_dup_${Date.now()}`,
      device_id: 'ring_dev_front_door_01',
      event_type: 'button_press',
      created_at: new Date().toISOString()
    });

    const reqId = `req_idempotent_${Date.now()}`;
    const { signatureHeader } = generateRingWebhookSignature(payload, secret);

    // First request -> accepted
    const firstRes = await handleRingWebhook({
      headers: {
        'x-ring-signature': signatureHeader,
        'x-ring-request-id': reqId
      },
      body: payload
    }, secret);
    expect(firstRes.statusCode).toBe(200);
    expect(JSON.parse(firstRes.body).status).toBe('accepted');

    // Second request with same reqId -> ignored duplicate
    const secondRes = await handleRingWebhook({
      headers: {
        'x-ring-signature': signatureHeader,
        'x-ring-request-id': reqId
      },
      body: payload
    }, secret);
    expect(secondRes.statusCode).toBe(200);
    expect(JSON.parse(secondRes.body).status).toBe('ignored_duplicate');
  });

  it('rejects an invalid signature with 401 Unauthorized', async () => {
    const payload = JSON.stringify({
      event_id: 'evt_fake',
      device_id: 'ring_dev_01',
      event_type: 'button_press',
      created_at: new Date().toISOString()
    });

    const response = await handleRingWebhook({
      headers: {
        'x-ring-signature': 't=1234567,v1=invalid_hmac_hex',
        'x-ring-request-id': 'req_fake_1'
      },
      body: payload
    }, secret);

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toContain('Signature verification failed');
  });

  it('rejects malformed payload with 400 Bad Request', async () => {
    const malformedBody = '{"broken_json":';
    const { signatureHeader } = generateRingWebhookSignature(malformedBody, secret);

    const response = await handleRingWebhook({
      headers: {
        'x-ring-signature': signatureHeader,
        'x-ring-request-id': `req_broken_${Date.now()}`
      },
      body: malformedBody
    }, secret);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toContain('Malformed Ring webhook JSON payload');
  });
});
