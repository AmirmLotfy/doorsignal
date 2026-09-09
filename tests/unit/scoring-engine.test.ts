import { describe, it, expect } from 'vitest';
import { 
  scoreCandidate, 
  filterViableCandidates, 
  ExpectedArrivalCandidate, 
  ArrivalEventContext 
} from '../../services/arrival-resolver/src/deterministic.js';

describe('Arrival Resolver Scoring Engine', () => {
  const now = new Date();

  const mockCandidates: ExpectedArrivalCandidate[] = [
    {
      id: 'cand_maya_interview',
      siteId: 'site_northline',
      displayName: 'Maya Patel Candidate Interview',
      intent: 'GUEST',
      windowStart: new Date(now.getTime() - 2 * 60000), // arrived 2 mins early
      windowEnd: new Date(now.getTime() + 45 * 60000),
      checkinToken: 'TOK-ALEX-1030',
      status: 'PENDING'
    },
    {
      id: 'cand_late_meeting',
      siteId: 'site_northline',
      displayName: 'Afternoon Client Meeting',
      intent: 'GUEST',
      windowStart: new Date(now.getTime() + 180 * 60000), // 3 hours in the future
      windowEnd: new Date(now.getTime() + 240 * 60000),
      status: 'PENDING'
    }
  ];

  it('Stage 1 filters out appointments outside the arrival window', () => {
    const event: ArrivalEventContext = {
      siteId: 'site_northline',
      doorDeviceId: 'ring_dev_front_door_01',
      doorDeviceType: 'DOORBELL',
      eventType: 'BUTTON_PRESS',
      occurredAt: now
    };

    const viable = filterViableCandidates(mockCandidates, event, 30);
    expect(viable).toHaveLength(1);
    expect(viable[0].id).toBe('cand_maya_interview');
  });

  it('Stage 2 scores high confidence when visitor check-in token matches', () => {
    const eventWithToken: ArrivalEventContext = {
      siteId: 'site_northline',
      doorDeviceId: 'ring_dev_front_door_01',
      doorDeviceType: 'DOORBELL',
      eventType: 'BUTTON_PRESS',
      occurredAt: now,
      checkinTokenReceived: 'TOK-ALEX-1030'
    };

    const result = scoreCandidate(mockCandidates[0], eventWithToken);
    expect(result.score).toBeGreaterThanOrEqual(0.80);
    expect(result.breakdown.tokenMatch).toBe(0.40);
    expect(result.breakdown.timeProximity).toBe(0.25);
    expect(result.explanation).toContain('visitor checked in with token');
  });

  it('Package event gives intent compatibility bonus to DELIVERY intent', () => {
    const deliveryCand: ExpectedArrivalCandidate = {
      id: 'cand_package',
      siteId: 'site_northline',
      displayName: 'FedEx Parcel',
      intent: 'DELIVERY',
      windowStart: new Date(now.getTime() - 30 * 60000),
      windowEnd: new Date(now.getTime() + 60 * 60000),
      preferredDoorId: 'ring_dev_dock',
      status: 'PENDING'
    };

    const packageEvent: ArrivalEventContext = {
      siteId: 'site_northline',
      doorDeviceId: 'ring_dev_dock',
      doorDeviceType: 'CAMERA',
      eventType: 'PACKAGE_DETECTED',
      occurredAt: now
    };

    const result = scoreCandidate(deliveryCand, packageEvent);
    expect(result.breakdown.intentCompatibility).toBe(0.10);
    expect(result.breakdown.doorCompatibility).toBe(0.10);
  });
});
