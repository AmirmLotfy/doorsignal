import { ExpectedArrivalCandidate } from '@doorsignal/arrival-resolver';

// Shared in-memory store for expected arrivals created via external public API
const globalForExpected = globalThis as unknown as {
  __doorSignalExpected?: Map<string, ExpectedArrivalCandidate>;
};

export const externalExpectedArrivals =
  globalForExpected.__doorSignalExpected ?? new Map<string, ExpectedArrivalCandidate>();
globalForExpected.__doorSignalExpected = externalExpectedArrivals;

// Pre-seed default candidates if empty
if (externalExpectedArrivals.size === 0) {
  externalExpectedArrivals.set('cand_seed_maya', {
    id: 'cand_seed_maya',
    siteId: 'site_northline_01',
    displayName: 'Candidate Interview with Maya Patel (10:30 – 11:15)',
    intent: 'GUEST',
    windowStart: new Date(Date.now() - 5 * 60000),
    windowEnd: new Date(Date.now() + 45 * 60000),
    checkinToken: 'TOK-ALEX-1030',
    status: 'PENDING'
  });
  externalExpectedArrivals.set('cand_seed_fedex', {
    id: 'cand_seed_fedex',
    siteId: 'site_northline_01',
    displayName: 'Office Supplies (FedEx)',
    intent: 'DELIVERY',
    windowStart: new Date(Date.now() - 60 * 60000),
    windowEnd: new Date(Date.now() + 180 * 60000),
    preferredDoorId: 'ring_dev_dock_02',
    status: 'PENDING'
  });
}
