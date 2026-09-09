import { CaseStatus, CaseActionType } from './case';

export const AllowedStateTransitions: Record<CaseStatus, CaseStatus[]> = {
  DETECTED: ['CONTEXTUALIZING', 'UNMATCHED'],
  CONTEXTUALIZING: ['MATCHED', 'UNMATCHED'],
  MATCHED: ['ROUTED', 'UNMATCHED', 'RESOLVED'],
  UNMATCHED: ['ROUTED', 'RESOLVED'],
  ROUTED: ['ACKNOWLEDGED', 'RESOLVED', 'UNMATCHED'],
  ACKNOWLEDGED: ['RESOLVED'],
  RESOLVED: [] // Terminal state
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return AllowedStateTransitions[from]?.includes(to) ?? false;
}

export function transitionStateOnAction(currentStatus: CaseStatus, action: CaseActionType): CaseStatus {
  switch (action) {
    case 'NOTIFY_HOST':
    case 'ESCALATE_ON_CALL':
      return canTransition(currentStatus, 'ROUTED') ? 'ROUTED' : currentStatus;
    case 'ON_MY_WAY':
      return canTransition(currentStatus, 'ACKNOWLEDGED') ? 'ACKNOWLEDGED' : currentStatus;
    case 'MARK_RECEIVED':
    case 'DISMISS':
      return canTransition(currentStatus, 'RESOLVED') ? 'RESOLVED' : currentStatus;
    case 'NOT_A_MATCH':
      return canTransition(currentStatus, 'UNMATCHED') ? 'UNMATCHED' : currentStatus;
    default:
      return currentStatus;
  }
}
