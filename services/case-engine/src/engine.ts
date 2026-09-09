import { 
  ArrivalCase, 
  CaseActionType, 
  CaseStatus, 
  DoorEventType, 
  transitionStateOnAction 
} from '@doorsignal/arrival-schema';
import { resolveArrival, ExpectedArrivalCandidate } from '@doorsignal/arrival-resolver';
import { eventBus, EventTopics } from '@doorsignal/events';

let caseCounter = 1040;

export interface CreateCaseParams {
  siteId: string;
  doorDeviceId: string;
  doorDeviceName?: string;
  eventType: DoorEventType;
  occurredAt?: Date;
  checkinToken?: string;
}

export interface InMemoryCaseRecord extends ArrivalCase {
  deviceName: string;
  matchBreakdown?: string[];
  candidatesList?: Array<{
    displayName: string;
    score: number;
    explanation: string;
  }>;
  actionsHistory: Array<{
    actionType: CaseActionType;
    actor: string;
    timestamp: Date;
  }>;
}

// Global case store to preserve state across Next.js route bundles
const globalForCases = globalThis as unknown as {
  __doorSignalCases?: Map<string, InMemoryCaseRecord>;
};

export const activeCases = globalForCases.__doorSignalCases ?? new Map<string, InMemoryCaseRecord>();
globalForCases.__doorSignalCases = activeCases;

export async function processDoorEventToCase(
  params: CreateCaseParams,
  availableCandidates: ExpectedArrivalCandidate[]
): Promise<InMemoryCaseRecord> {
  const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  caseCounter += 1;
  const caseNumber = `DS-${caseCounter}`;
  const now = params.occurredAt || new Date();

  // 1. Initial DETECTED state
  const newCase: InMemoryCaseRecord = {
    id: caseId,
    caseNumber,
    doorEventId: `evt_${Date.now()}`,
    siteId: params.siteId,
    deviceName: params.doorDeviceName || 'Front Entry',
    intent: 'UNMATCHED',
    status: 'DETECTED',
    matchReason: 'Analyzing arrival context...',
    confidenceInternal: 0,
    expectedArrivalId: null,
    resolvedAt: null,
    resolvedByUserId: null,
    createdAt: now,
    updatedAt: now,
    actionsHistory: []
  };

  activeCases.set(caseId, newCase);
  await eventBus.publish(EventTopics.CASE_CREATED, { caseId, caseNumber, status: 'DETECTED' });

  // 2. CONTEXTUALIZING -> Run Arrival Resolver (Stages 1-4)
  newCase.status = 'CONTEXTUALIZING';
  await eventBus.publish(EventTopics.CASE_CONTEXTUALIZED, { caseId, status: 'CONTEXTUALIZING' });

  const resolution = await resolveArrival(
    {
      siteId: params.siteId,
      doorDeviceId: params.doorDeviceId,
      doorDeviceType: 'DOORBELL',
      eventType: params.eventType,
      occurredAt: now,
      checkinTokenReceived: params.checkinToken
    },
    availableCandidates
  );

  newCase.intent = resolution.intent;
  newCase.matchReason = resolution.matchReason;
  newCase.confidenceInternal = resolution.confidenceInternal;
  newCase.expectedArrivalId = resolution.matchedExpectedArrivalId;
  newCase.candidatesList = resolution.candidates.map((c) => ({
    displayName: c.displayName,
    score: c.score,
    explanation: c.explanation
  }));

  if (resolution.intent !== 'UNMATCHED') {
    newCase.status = 'MATCHED';
    await eventBus.publish(EventTopics.CASE_MATCHED, {
      caseId,
      intent: resolution.intent,
      matchReason: resolution.matchReason
    });
  } else {
    newCase.status = 'UNMATCHED';
    await eventBus.publish(EventTopics.CASE_UNMATCHED, {
      caseId,
      matchReason: resolution.matchReason
    });
  }

  newCase.updatedAt = new Date();
  activeCases.set(caseId, newCase);
  return newCase;
}

export function executeCaseAction(
  caseId: string,
  action: CaseActionType,
  actor: string = 'User'
): InMemoryCaseRecord | null {
  const currentCase = activeCases.get(caseId);
  if (!currentCase) return null;

  const nextStatus = transitionStateOnAction(currentCase.status, action);
  currentCase.status = nextStatus;
  currentCase.updatedAt = new Date();

  currentCase.actionsHistory.push({
    actionType: action,
    actor,
    timestamp: new Date()
  });

  if (nextStatus === 'RESOLVED') {
    currentCase.resolvedAt = new Date();
    eventBus.publish(EventTopics.CASE_RESOLVED, { caseId, action });
  } else if (nextStatus === 'ROUTED') {
    eventBus.publish(EventTopics.CASE_ROUTED, { caseId, action });
  } else if (nextStatus === 'ACKNOWLEDGED') {
    eventBus.publish(EventTopics.CASE_ACKNOWLEDGED, { caseId, action });
  }

  activeCases.set(caseId, currentCase);
  return currentCase;
}
