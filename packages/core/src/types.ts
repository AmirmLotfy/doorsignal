import { z } from 'zod';

export const id = z.string().min(1).max(160).regex(/^[a-zA-Z0-9_.:-]+$/);
export const instant = z.string().datetime({ offset: true });
export const kind = z.enum(['GUEST', 'DELIVERY', 'SERVICE', 'UNMATCHED']);
export type Kind = z.infer<typeof kind>;
export type Mode = 'replay' | 'live';
export type Principal = { siteId: string; subject: string; role: 'operator' | 'judge' | 'integration'; mode: Mode };
export const expectedInput = z.object({
  name: z.string().trim().min(1).max(80), host: z.string().trim().min(1).max(80),
  kind: z.enum(['GUEST', 'DELIVERY', 'SERVICE']),
  startsAt: instant, endsAt: instant, note: z.string().trim().max(240).default(''),
}).strict().superRefine((value, ctx) => {
  const start = Date.parse(value.startsAt), end = Date.parse(value.endsAt);
  if (end <= start || end - start > 86400000) ctx.addIssue({ code: 'custom', message: 'Choose an arrival window of at most 24 hours, ending after it starts.' });
});
export type Expected = z.infer<typeof expectedInput> & { id: string; createdAt: string };
export const actionInput = z.object({ action: z.enum(['ACKNOWLEDGE', 'RECEIVED', 'COLLECTED', 'CONFIRM', 'DISMISS', 'NOT_A_MATCH', 'NOTIFY', 'ESCALATE']), version: z.number().int().positive() }).strict();
export type Action = z.infer<typeof actionInput>['action'];
export type TimelineEntry = { at: string; actor: string; text: string };
export type Scene = { status: 'available' | 'unknown'; personPresent: boolean | null; packagePresent: boolean | null; vehiclePresent: boolean | null; reason: string };
export type Arrival = {
  id: string; eventId: string; deviceId: string; occurredAt: string; createdAt: string;
  source: 'ring_webhook' | 'ring_history' | 'demo_replay' | 'checkin';
  kind: Kind; status: 'needs_review' | 'waiting' | 'acknowledged' | 'received' | 'resolved';
  title: string; owner: string; reason: string; match: 'tentative' | 'checkin' | 'human' | 'unknown';
  expectedId?: string; checkinId?: string; scene: Scene; timeline: TimelineEntry[];
};
export type Notification = {
  id: string; caseId: string; title: string; createdAt: string;
  channel: 'in_app' | 'email'; state: 'queued' | 'sending' | 'sent' | 'failed';
  attempts: number; error?: string; messageId?: string; leaseUntil?: number;
};
export type Checkin = { id: string; caseId: string; name: string; kind: Kind; createdAt: string; statusSecretHash: string };
export type SiteSettings = { name: string; timeZone: string; retentionDays: number; emailEnabled: boolean };
export type DoorEvent = {
  id: string; requestId: string; accountId: string; deviceId: string;
  type: string; occurredAt: string; source: Arrival['source']; acceptedAt: string;
};
export const ringEnvelope = z.object({
  meta: z.object({ version: z.literal('1.1'), time: instant, request_id: id, account_id: id }),
  data: z.object({ id, type: z.string().min(1).max(80), attributes: z.object({
    source: id, source_type: z.literal('devices'), timestamp: z.number().int().positive(),
    sub_type: z.string().max(80).optional(), component_ids: z.array(z.string().max(30)).max(8).optional(),
  }).passthrough() }).passthrough(),
});
export type RingEnvelope = z.infer<typeof ringEnvelope>;
export type RecordItem<T = unknown> = { pk: string; sk: string; version: number; expiresAt: number; data: T };
export type Versioned<T> = T & { version: number };
export const unknownScene = (reason = 'No camera image was analyzed.'): Scene => ({ status: 'unknown', personPresent: null, packagePresent: null, vehiclePresent: null, reason });
export class AppError extends Error { constructor(public status: number, message: string) { super(message); this.name = 'AppError'; } }
