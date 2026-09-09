import { z } from 'zod';

export const DoorEventTypeEnum = z.enum([
  'BUTTON_PRESS',
  'MOTION_DETECTED',
  'PACKAGE_DETECTED'
]);

export type DoorEventType = z.infer<typeof DoorEventTypeEnum>;

export const RingWebhookPayloadSchema = z.object({
  event_id: z.string(),
  device_id: z.string(),
  event_type: z.enum(['button_press', 'motion_detected', 'package_detected']),
  created_at: z.string(), // ISO 8601 string
  data: z.record(z.unknown()).optional()
});

export type RingWebhookPayload = z.infer<typeof RingWebhookPayloadSchema>;

export const CoarseVisionMetadataSchema = z.object({
  person_present: z.boolean().default(true),
  person_count: z.number().int().nonnegative().default(1),
  package_present: z.boolean().default(false),
  vehicle_present: z.boolean().default(false)
});

export type CoarseVisionMetadata = z.infer<typeof CoarseVisionMetadataSchema>;

export const DoorEventSchema = z.object({
  id: z.string().uuid(),
  ringDeviceId: z.string().uuid(),
  ringRequestId: z.string(),
  eventType: DoorEventTypeEnum,
  occurredAt: z.date(),
  payloadHash: z.string(),
  coarseVisionMetadata: CoarseVisionMetadataSchema.optional(),
  processedAt: z.date().optional()
});

export type DoorEvent = z.infer<typeof DoorEventSchema>;
