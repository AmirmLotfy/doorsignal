import { RingWebhookPayload } from '@doorsignal/arrival-schema';
import { generateRingWebhookSignature } from './webhook-crypto';

export interface SimulatedEventOptions {
  deviceId?: string;
  eventType: 'button_press' | 'motion_detected' | 'package_detected';
  data?: Record<string, unknown>;
  secret?: string;
}

export function createSimulatedRingEvent({
  deviceId = 'ring_dev_front_door_01',
  eventType,
  data = {},
  secret = 'ds_ring_webhook_secret_dev_key'
}: SimulatedEventOptions): {
  payload: RingWebhookPayload;
  rawBody: string;
  headers: Record<string, string>;
} {
  const eventId = `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  
  const payload: RingWebhookPayload = {
    event_id: eventId,
    device_id: deviceId,
    event_type: eventType,
    created_at: now.toISOString(),
    data: {
      door_state: 'closed',
      battery_percentage: 92,
      ...data
    }
  };

  const rawBody = JSON.stringify(payload);
  const { signatureHeader, timestamp } = generateRingWebhookSignature(rawBody, secret);

  return {
    payload,
    rawBody,
    headers: {
      'Content-Type': 'application/json',
      'X-Ring-Signature': signatureHeader,
      'X-Ring-Timestamp': timestamp.toString(),
      'X-Ring-Request-Id': `req_sim_${Date.now()}`
    }
  };
}
