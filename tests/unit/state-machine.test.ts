import { describe, it, expect } from 'vitest';
import { 
  canTransition, 
  transitionStateOnAction 
} from '../../packages/arrival-schema/src/state-machine.js';

describe('Arrival Case State Machine Transitions', () => {
  it('allows valid transitions from DETECTED to CONTEXTUALIZING', () => {
    expect(canTransition('DETECTED', 'CONTEXTUALIZING')).toBe(true);
    expect(canTransition('DETECTED', 'UNMATCHED')).toBe(true);
    expect(canTransition('DETECTED', 'RESOLVED')).toBe(false);
  });

  it('allows transition to ROUTED upon NOTIFY_HOST action', () => {
    const next = transitionStateOnAction('MATCHED', 'NOTIFY_HOST');
    expect(next).toBe('ROUTED');
  });

  it('allows transition to ACKNOWLEDGED upon ON_MY_WAY action', () => {
    const next = transitionStateOnAction('ROUTED', 'ON_MY_WAY');
    expect(next).toBe('ACKNOWLEDGED');
  });

  it('resolves case upon MARK_RECEIVED or DISMISS', () => {
    expect(transitionStateOnAction('ROUTED', 'MARK_RECEIVED')).toBe('RESOLVED');
    expect(transitionStateOnAction('UNMATCHED', 'DISMISS')).toBe('RESOLVED');
  });

  it('prevents invalid transitions out of terminal RESOLVED state', () => {
    expect(canTransition('RESOLVED', 'DETECTED')).toBe(false);
    expect(canTransition('RESOLVED', 'ROUTED')).toBe(false);
  });
});
