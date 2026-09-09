import { describe, it, expect } from 'vitest';
import { evaluateAgentPolicy } from '../../services/arrival-resolver/src/agent/policies.js';

describe('AWS Bedrock AgentCore Policy Guardrails', () => {
  it('strictly blocks any automated door unlock or physical access tool', () => {
    const result = evaluateAgentPolicy({
      toolName: 'smart_lock_unlock_door',
      parameters: { doorId: 'front_door' },
      context: {
        arrivalCaseId: 'case_1',
        intent: 'GUEST',
        isIdentified: true
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.violationReason).toContain('Automated physical access/unlock actions are strictly prohibited');
  });

  it('strictly blocks facial recognition or biometric tool execution', () => {
    const result = evaluateAgentPolicy({
      toolName: 'biometric_recognize_person_face',
      parameters: { imageRef: 's3://media/snapshot.jpg' },
      context: {
        arrivalCaseId: 'case_2',
        intent: 'UNMATCHED',
        isIdentified: false
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.violationReason).toContain('Zero-biometric architecture');
  });

  it('allows operational notification and routing tools', () => {
    const result = evaluateAgentPolicy({
      toolName: 'route_case_and_notify_host',
      parameters: { hostEmail: 'maya@northline.studio', caseId: 'DS-1042' },
      context: {
        arrivalCaseId: 'case_3',
        intent: 'GUEST',
        isIdentified: true
      }
    });

    expect(result.allowed).toBe(true);
    expect(result.violationReason).toBeUndefined();
  });
});
