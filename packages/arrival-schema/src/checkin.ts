import { z } from 'zod';
import { ArrivalIntentEnum } from './intent';

export const VisitorCheckinPayloadSchema = z.object({
  siteId: z.string().uuid(),
  intent: ArrivalIntentEnum,
  visitorName: z.string().min(1, 'Please enter your name'),
  checkinToken: z.string().optional(),
  hostNameSearched: z.string().optional(),
  notes: z.string().optional()
});

export type VisitorCheckinPayload = z.infer<typeof VisitorCheckinPayloadSchema>;

export const CheckinSessionSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  arrivalCaseId: z.string().uuid().optional(),
  expectedArrivalId: z.string().uuid().optional(),
  intent: ArrivalIntentEnum,
  visitorName: z.string().optional(),
  hostNameSearched: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date()
});

export type CheckinSession = z.infer<typeof CheckinSessionSchema>;
