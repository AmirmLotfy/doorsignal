import { ArrivalIntent, DoorEventType } from '@doorsignal/arrival-schema';

export interface ExpectedArrivalCandidate {
  id: string;
  siteId: string;
  displayName: string;
  intent: ArrivalIntent;
  windowStart: Date;
  windowEnd: Date;
  checkinToken?: string | null;
  preferredDoorId?: string | null;
  status: string;
}

export interface ArrivalEventContext {
  siteId: string;
  doorDeviceId: string;
  doorDeviceType: string;
  eventType: DoorEventType;
  occurredAt: Date;
  checkinTokenReceived?: string | null;
  coarseVision?: {
    personPresent?: boolean;
    packagePresent?: boolean;
    vehiclePresent?: boolean;
  };
}

export interface CandidateScoringResult {
  candidateId: string;
  displayName: string;
  intent: ArrivalIntent;
  score: number;
  breakdown: {
    tokenMatch: number;
    timeProximity: number;
    siteMatch: number;
    intentCompatibility: number;
    doorCompatibility: number;
  };
  explanation: string;
}

/**
 * Stage 1: Deterministic filtering
 * Selects only candidates matching site, active status, and within +/- 30m of scheduled window.
 */
export function filterViableCandidates(
  candidates: ExpectedArrivalCandidate[],
  event: ArrivalEventContext,
  bufferMinutes: number = 30
): ExpectedArrivalCandidate[] {
  const eventTime = event.occurredAt.getTime();
  const bufferMs = bufferMinutes * 60 * 1000;

  return candidates.filter((cand) => {
    if (cand.status !== 'PENDING') return false;
    if (cand.siteId !== event.siteId) return false;

    const startWindow = cand.windowStart.getTime() - bufferMs;
    const endWindow = cand.windowEnd.getTime() + bufferMs;

    return eventTime >= startWindow && eventTime <= endWindow;
  });
}

/**
 * Stage 2: Contextual Heuristic Scoring
 * Formula:
 * - pre-registered / check-in token match: 0.40
 * - time proximity: 0.25
 * - correct site: 0.15
 * - arrival intent compatibility: 0.10
 * - door compatibility: 0.10
 */
export function scoreCandidate(
  cand: ExpectedArrivalCandidate,
  event: ArrivalEventContext
): CandidateScoringResult {
  let tokenMatch = 0;
  let timeProximity = 0;
  let siteMatch = 0.15; // By definition of Stage 1 filter, site matches
  let intentCompatibility = 0;
  let doorCompatibility = 0.05; // Base compatibility

  // 1. Token match (0.40 max)
  if (
    cand.checkinToken &&
    event.checkinTokenReceived &&
    cand.checkinToken.trim().toLowerCase() === event.checkinTokenReceived.trim().toLowerCase()
  ) {
    tokenMatch = 0.40;
  }

  // 2. Time proximity (0.25 max)
  const eventTime = event.occurredAt.getTime();
  const startTime = cand.windowStart.getTime();
  const diffMinutes = Math.abs(eventTime - startTime) / (60 * 1000);

  if (diffMinutes <= 5) {
    timeProximity = 0.25; // Spot on (within 5 minutes)
  } else if (diffMinutes <= 15) {
    timeProximity = 0.20;
  } else if (diffMinutes <= 30) {
    timeProximity = 0.12;
  } else {
    timeProximity = 0.05;
  }

  // 3. Intent compatibility (0.10 max)
  if (event.eventType === 'PACKAGE_DETECTED' || event.coarseVision?.packagePresent) {
    if (cand.intent === 'DELIVERY') {
      intentCompatibility = 0.10;
    }
  } else if (event.eventType === 'BUTTON_PRESS') {
    if (cand.intent === 'GUEST' || cand.intent === 'SERVICE') {
      intentCompatibility = 0.10;
    }
  } else if (event.eventType === 'MOTION_DETECTED') {
    intentCompatibility = 0.05;
  }

  // 4. Door compatibility (0.10 max)
  if (cand.preferredDoorId && cand.preferredDoorId === event.doorDeviceId) {
    doorCompatibility = 0.10;
  } else if (!cand.preferredDoorId) {
    doorCompatibility = 0.08;
  }

  const totalScore = Math.min(
    1.0,
    parseFloat((tokenMatch + timeProximity + siteMatch + intentCompatibility + doorCompatibility).toFixed(2))
  );

  const reasons: string[] = [];
  if (tokenMatch > 0) reasons.push('visitor checked in with token');
  if (diffMinutes <= 5) {
    reasons.push(diffMinutes === 0 ? 'arrived on time' : `arrived ${Math.round(diffMinutes)} min early/late`);
  }
  reasons.push('correct site');

  return {
    candidateId: cand.id,
    displayName: cand.displayName,
    intent: cand.intent,
    score: totalScore,
    breakdown: {
      tokenMatch,
      timeProximity,
      siteMatch,
      intentCompatibility,
      doorCompatibility
    },
    explanation: reasons.join(' · ')
  };
}
