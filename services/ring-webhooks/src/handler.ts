import { RingWebhookPayloadSchema } from '@doorsignal/arrival-schema';
import { verifyAndDeduplicate } from './verifier';
import { eventBus, EventTopics } from '@doorsignal/events';

export interface WebhookHttpEvent {
  headers: Record<string, string | undefined>;
  body: string;
}

export interface WebhookHttpResponse {
  statusCode: number;
  body: string;
}

function getHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      return headers[key];
    }
  }
  return undefined;
}

export async function handleRingWebhook(
  event: WebhookHttpEvent,
  webhookSecret: string = process.env.RING_WEBHOOK_SECRET || 'ds_ring_webhook_secret_dev_key'
): Promise<WebhookHttpResponse> {
  const signatureHeader = getHeader(event.headers, 'x-ring-signature') || getHeader(event.headers, 'ring-signature') || '';
  const requestId = getHeader(event.headers, 'x-ring-request-id') || getHeader(event.headers, 'ring-request-id') || `req_${Date.now()}`;
  const rawBody = event.body || '';

  const { success, isDuplicate, error } = verifyAndDeduplicate(
    rawBody,
    signatureHeader,
    requestId,
    webhookSecret
  );

  if (!success) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: `Signature verification failed: ${error}` })
    };
  }

  if (isDuplicate) {
    // Idempotent success response
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ignored_duplicate', requestId })
    };
  }

  let payload;
  try {
    const rawParsed = JSON.parse(rawBody);
    payload = RingWebhookPayloadSchema.parse(rawParsed);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Malformed Ring webhook JSON payload' })
    };
  }

  // Normalize event type to EventBridge domain topics
  let topic: string;
  if (payload.event_type === 'button_press') {
    topic = EventTopics.DOOR_BUTTON_PRESSED;
  } else if (payload.event_type === 'package_detected') {
    topic = EventTopics.DOOR_PACKAGE_DETECTED;
  } else {
    topic = EventTopics.DOOR_MOTION_DETECTED;
  }

  await eventBus.publish(topic as any, {
    eventId: payload.event_id,
    deviceId: payload.device_id,
    eventType: payload.event_type,
    occurredAt: payload.created_at,
    metadata: payload.data
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'accepted', eventId: payload.event_id, topic })
  };
}
