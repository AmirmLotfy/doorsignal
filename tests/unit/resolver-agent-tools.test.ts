import { describe, it, expect } from 'vitest';
import { ResolverAgentTools } from '../../services/arrival-resolver/src/agent/tools.js';
import { resolveArrival } from '../../services/arrival-resolver/src/agent/resolver.js';
import { ExpectedArrivalCandidate } from '../../services/arrival-resolver/src/deterministic.js';

describe('Arrival Resolver Agent Tools QA', () => {
  it('executes agent tools and records execution traces', async () => {
    const tools = new ResolverAgentTools();

    const arrivals = await tools.getExpectedArrivals(
      'site_northline',
      new Date(Date.now() - 30 * 60000),
      new Date(Date.now() + 30 * 60000)
    );
    expect(Array.isArray(arrivals)).toBe(true);

    const checkins = await tools.getRecentCheckins('site_northline', 5);
    expect(Array.isArray(checkins)).toBe(true);

    const traces = tools.getTraces();
    expect(traces.length).toBeGreaterThanOrEqual(2);
    expect(traces[0].toolName).toBe('get_expected_arrivals');
    expect(traces[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(traces[1].toolName).toBe('get_recent_checkins');
  });

  it('resolves ambiguous multi-candidate arrival by picking top candidate with trace logging', async () => {
    const now = new Date();

    const candidate1: ExpectedArrivalCandidate = {
      id: 'cand_a',
      siteId: 'site_test',
      displayName: 'Maya Meeting',
      intent: 'GUEST',
      windowStart: new Date(now.getTime() - 2 * 60000),
      windowEnd: new Date(now.getTime() + 30 * 60000),
      status: 'PENDING'
    };

    const candidate2: ExpectedArrivalCandidate = {
      id: 'cand_b',
      siteId: 'site_test',
      displayName: 'Oliver Meeting',
      intent: 'GUEST',
      windowStart: new Date(now.getTime() - 10 * 60000),
      windowEnd: new Date(now.getTime() + 30 * 60000),
      status: 'PENDING'
    };

    const result = await resolveArrival(
      {
        siteId: 'site_test',
        doorDeviceId: 'door_1',
        doorDeviceType: 'DOORBELL',
        eventType: 'BUTTON_PRESS',
        occurredAt: now
      },
      [candidate1, candidate2]
    );

    expect(result.intent).toBe('GUEST');
    expect(result.matchedExpectedArrivalId).toBe('cand_a');
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].score).toBeGreaterThan(result.candidates[1].score);
  });
});
