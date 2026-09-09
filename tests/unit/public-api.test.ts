import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  GET as getExpectedArrivals, 
  POST as postExpectedArrivals
} from '../../apps/web/src/app/api/v1/expected-arrivals/route.js';
import { externalExpectedArrivals } from '../../apps/web/src/app/api/v1/expected-arrivals/store.js';
import { 
  GET as getArrivalCase, 
  POST as postArrivalCase 
} from '../../apps/web/src/app/api/v1/arrival-cases/[id]/route.js';
import { 
  POST as postResolveArrivalCase 
} from '../../apps/web/src/app/api/v1/arrival-cases/[id]/resolve/route.js';
import { activeCases, processDoorEventToCase } from '../../services/case-engine/src/engine.js';

describe('Public Platform REST API QA (§22)', () => {
  beforeEach(() => {
    activeCases.clear();
    externalExpectedArrivals.clear();
  });

  it('POST /api/v1/expected-arrivals creates a valid arrival intent', async () => {
    const payload = {
      site_id: 'site_northline_01',
      display_name: 'Electrician #42 (HVAC Fix)',
      intent: 'SERVICE',
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 60 * 60000).toISOString(),
      checkin_token: 'TOK-ELEC-42'
    };

    const req = new NextRequest('http://localhost:3000/api/v1/expected-arrivals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await postExpectedArrivals(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.object).toBe('expected_arrival');
    expect(data.intent).toBe('SERVICE');
    expect(data.display_name).toBe('Electrician #42 (HVAC Fix)');
    expect(data.checkin_token).toBe('TOK-ELEC-42');
  });

  it('POST /api/v1/expected-arrivals rejects invalid intents', async () => {
    const payload = {
      site_id: 'site_northline_01',
      display_name: 'Random Visitor',
      intent: 'INVALID_INTENT',
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 60 * 60000).toISOString()
    };

    const req = new NextRequest('http://localhost:3000/api/v1/expected-arrivals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await postExpectedArrivals(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('invalid_intent');
  });

  it('GET /api/v1/expected-arrivals returns list filtered by site and intent', async () => {
    externalExpectedArrivals.set('test_guest', {
      id: 'test_guest',
      siteId: 'site_northline_01',
      displayName: 'Maya Patel Candidate',
      intent: 'GUEST',
      windowStart: new Date(),
      windowEnd: new Date(Date.now() + 30 * 60000),
      status: 'PENDING'
    });

    externalExpectedArrivals.set('test_delivery', {
      id: 'test_delivery',
      siteId: 'site_northline_01',
      displayName: 'FedEx Restock',
      intent: 'DELIVERY',
      windowStart: new Date(),
      windowEnd: new Date(Date.now() + 30 * 60000),
      status: 'PENDING'
    });

    const req = new NextRequest('http://localhost:3000/api/v1/expected-arrivals?site_id=site_northline_01&intent=GUEST');
    const res = await getExpectedArrivals(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.object).toBe('list');
    expect(data.total_count).toBe(1);
    expect(data.data[0].displayName).toBe('Maya Patel Candidate');
  });

  it('GET /api/v1/arrival-cases/:id retrieves case telemetry and 404s when not found', async () => {
    const created = await processDoorEventToCase(
      {
        siteId: 'site_northline_01',
        doorDeviceId: 'ring_front_01',
        doorDeviceName: 'Front Entry',
        eventType: 'BUTTON_PRESS',
        occurredAt: new Date()
      },
      []
    );

    // Valid case lookup
    const req = new NextRequest(`http://localhost:3000/api/v1/arrival-cases/${created.id}`);
    const res = await getArrivalCase(req, { params: { id: created.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.object).toBe('arrival_case');
    expect(data.id).toBe(created.id);
    expect(data.case_number).toBe(created.caseNumber);

    // Non-existent case
    const missingReq = new NextRequest('http://localhost:3000/api/v1/arrival-cases/case_missing_123');
    const missingRes = await getArrivalCase(missingReq, { params: { id: 'case_missing_123' } });
    expect(missingRes.status).toBe(404);
  });

  it('POST /api/v1/arrival-cases/:id/resolve concludes an active case', async () => {
    const created = await processDoorEventToCase(
      {
        siteId: 'site_northline_01',
        doorDeviceId: 'ring_front_01',
        doorDeviceName: 'Front Entry',
        eventType: 'BUTTON_PRESS',
        occurredAt: new Date()
      },
      []
    );

    const resolveReq = new NextRequest(`http://localhost:3000/api/v1/arrival-cases/${created.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved_by: 'Office Manager Maya', notes: 'Checked in manually at door' })
    });

    const res = await postResolveArrivalCase(resolveReq, { params: { id: created.id } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('RESOLVED');
    expect(data.resolved_by).toBe('Office Manager Maya');
  });
});
