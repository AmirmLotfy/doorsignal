import { describe, it, expect } from 'vitest';
import { 
  ArrivalIntentSchema, 
  RingWebhookPayloadSchema,
  CaseActionPayloadSchema,
  ArrivalCaseSchema 
} from '../../packages/arrival-schema/src/index.js';

describe('Arrival Schema & Data Contracts QA', () => {
  it('validates all 5 canonical arrival intents', () => {
    const intents = ['GUEST', 'DELIVERY', 'SERVICE', 'PICKUP', 'UNMATCHED'];
    for (const intent of intents) {
      expect(ArrivalIntentSchema.parse(intent)).toBe(intent);
    }

    expect(() => ArrivalIntentSchema.parse('INTRUDER')).toThrow();
    expect(() => ArrivalIntentSchema.parse('RANDOM')).toThrow();
  });

  it('validates Ring webhook payload schema', () => {
    const valid = {
      event_id: 'evt_schema_1',
      device_id: 'ring_dev_1',
      event_type: 'button_press',
      created_at: new Date().toISOString(),
      data: { battery_level: 95 }
    };

    const parsed = RingWebhookPayloadSchema.parse(valid);
    expect(parsed.event_id).toBe('evt_schema_1');
    expect(parsed.event_type).toBe('button_press');
  });

  it('rejects Ring webhook with missing required fields', () => {
    const invalid = {
      event_id: 'evt_incomplete'
      // missing device_id, event_type, created_at
    };

    expect(() => RingWebhookPayloadSchema.parse(invalid)).toThrow();
  });

  it('validates case action payload actions', () => {
    const validActions = [
      'NOTIFY_HOST',
      'ON_MY_WAY',
      'MARK_RECEIVED',
      'NOT_A_MATCH',
      'DISMISS',
      'ESCALATE_ON_CALL'
    ];

    for (const action of validActions) {
      const parsed = CaseActionPayloadSchema.parse({
        action,
        actor: 'Test User'
      });
      expect(parsed.action).toBe(action);
    }

    expect(() => CaseActionPayloadSchema.parse({ action: 'UNLOCK_SMART_LOCK' })).toThrow();
  });
});
