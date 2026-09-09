import { z } from 'zod';
import { ArrivalIntentEnum } from './intent';

export const CaseStatusEnum = z.enum([
  'DETECTED',
  'CONTEXTUALIZING',
  'MATCHED',
  'UNMATCHED',
  'ROUTED',
  'ACKNOWLEDGED',
  'RESOLVED'
]);

export type CaseStatus = z.infer<typeof CaseStatusEnum>;

export const CaseCandidateEvidenceSchema = z.object({
  tokenMatch: z.number().min(0).max(1).default(0),
  timeProximity: z.number().min(0).max(1).default(0),
  siteMatch: z.number().min(0).max(1).default(0),
  intentCompatibility: z.number().min(0).max(1).default(0),
  doorCompatibility: z.number().min(0).max(1).default(0),
  explanation: z.string().optional()
});

export type CaseCandidateEvidence = z.infer<typeof CaseCandidateEvidenceSchema>;

export const CaseCandidateSchema = z.object({
  id: z.string().uuid(),
  arrivalCaseId: z.string().uuid(),
  expectedArrivalId: z.string().uuid(),
  internalScore: z.number().min(0).max(1),
  evidence: CaseCandidateEvidenceSchema,
  createdAt: z.date()
});

export type CaseCandidate = z.infer<typeof CaseCandidateSchema>;

export const CaseActionTypeEnum = z.enum([
  'NOTIFY_HOST',
  'ON_MY_WAY',
  'MARK_RECEIVED',
  'NOT_A_MATCH',
  'DISMISS',
  'ESCALATE_ON_CALL',
  'VIEW_LIVE'
]);

export const CaseActionTypeSchema = CaseActionTypeEnum;

export const CaseActionPayloadSchema = z.object({
  action: CaseActionTypeEnum,
  actor: z.string().optional()
});

export type CaseActionType = z.infer<typeof CaseActionTypeEnum>;


export const CaseActionSchema = z.object({
  id: z.string().uuid(),
  arrivalCaseId: z.string().uuid(),
  actorType: z.enum(['USER', 'SYSTEM_AGENT', 'EXTERNAL_INTEGRATION']),
  actorId: z.string(),
  actionType: CaseActionTypeEnum,
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date()
});

export type CaseAction = z.infer<typeof CaseActionSchema>;

export const ArrivalCaseSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string(), // e.g. "DS-1042"
  doorEventId: z.string().uuid(),
  expectedArrivalId: z.string().uuid().optional().nullable(),
  siteId: z.string().uuid(),
  intent: ArrivalIntentEnum,
  status: CaseStatusEnum,
  matchReason: z.string().optional().nullable(),
  confidenceInternal: z.number().min(0).max(1).optional().nullable(),
  resolvedAt: z.date().optional().nullable(),
  resolvedByUserId: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ArrivalCase = z.infer<typeof ArrivalCaseSchema>;
