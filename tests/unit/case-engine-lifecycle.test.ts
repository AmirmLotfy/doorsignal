import { describe, it, expect, beforeEach } from 'vitest';
import { 
  processDoorEventToCase, 
  executeCaseAction, 
  activeCases 
} from '../../services/case-engine/src/engine.js';
import { ExpectedArrivalCandidate } from '../../services/arrival-resolver/src/deterministic.js';

describe('Case Engine Full Lifecycle QA', () => {
  const now = new Date();

  const mockCandidate: ExpectedArrivalCandidate = {
    id: 'cand_qa_maya_interview',
    siteId: 'site_northline_qa',
    displayName: 'Candidate Interview · Maya Patel',
    intent: 'GUEST',
    windowStart: new Date(now.getTime() - 2 * 60000),
    windowEnd: new Date(now.getTime() + 45 * 60000),
    checkinToken: 'TOK-QA-1030',
    status: 'PENDING'
  };

  beforeEach(() => {
    activeCases.clear();
  });

  it('correctly creates and contextualizes an expected GUEST case', async () => {
    const createdCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_qa',
        doorDeviceId: 'ring_dev_qa_01',
        doorDeviceName: 'Front Entry',
        eventType: 'BUTTON_PRESS',
        occurredAt: now,
        checkinToken: 'TOK-QA-1030'
      },
      [mockCandidate]
    );

    expect(createdCase.status).toBe('MATCHED');
    expect(createdCase.intent).toBe('GUEST');
    expect(createdCase.confidenceInternal).toBeGreaterThanOrEqual(0.90);
    expect(createdCase.expectedArrivalId).toBe('cand_qa_maya_interview');
    expect(createdCase.actionsHistory).toHaveLength(0);
  });

  it('progresses case state through NOTIFY_HOST -> ON_MY_WAY -> MARK_RECEIVED', async () => {
    const createdCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_qa',
        doorDeviceId: 'ring_dev_qa_01',
        eventType: 'BUTTON_PRESS',
        occurredAt: now,
        checkinToken: 'TOK-QA-1030'
      },
      [mockCandidate]
    );

    // 1. Host notification (MATCHED -> ROUTED)
    const routedCase = executeCaseAction(createdCase.id, 'NOTIFY_HOST', 'Reception Lead');
    expect(routedCase?.status).toBe('ROUTED');
    expect(routedCase?.actionsHistory).toHaveLength(1);
    expect(routedCase?.actionsHistory[0].actionType).toBe('NOTIFY_HOST');

    // 2. Host acknowledges (ROUTED -> ACKNOWLEDGED)
    const ackCase = executeCaseAction(createdCase.id, 'ON_MY_WAY', 'Maya Patel');
    expect(ackCase?.status).toBe('ACKNOWLEDGED');
    expect(ackCase?.actionsHistory).toHaveLength(2);

    // 3. Reception marks guest received (ACKNOWLEDGED -> RESOLVED)
    const resolvedCase = executeCaseAction(createdCase.id, 'MARK_RECEIVED', 'Front Desk');
    expect(resolvedCase?.status).toBe('RESOLVED');
    expect(resolvedCase?.resolvedAt).toBeInstanceOf(Date);
  });

  it('correctly handles NOT_A_MATCH rejection to UNMATCHED', async () => {
    const createdCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_qa',
        doorDeviceId: 'ring_dev_qa_01',
        eventType: 'BUTTON_PRESS',
        occurredAt: now,
        checkinToken: 'TOK-QA-1030'
      },
      [mockCandidate]
    );

    expect(createdCase.status).toBe('MATCHED');

    const unmatchedCase = executeCaseAction(createdCase.id, 'NOT_A_MATCH', 'Supervisor');
    expect(unmatchedCase?.status).toBe('UNMATCHED');

    // From UNMATCHED, operator can dismiss to RESOLVED
    const dismissedCase = executeCaseAction(createdCase.id, 'DISMISS', 'Supervisor');
    expect(dismissedCase?.status).toBe('RESOLVED');
  });

  it('correctly creates an UNMATCHED case when no candidates match', async () => {
    const unmatchedCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_qa',
        doorDeviceId: 'ring_dev_qa_01',
        eventType: 'BUTTON_PRESS',
        occurredAt: now
      },
      [] // No scheduled candidates
    );

    expect(unmatchedCase.status).toBe('UNMATCHED');
    expect(unmatchedCase.intent).toBe('UNMATCHED');
    expect(unmatchedCase.expectedArrivalId).toBeNull();
  });
});
