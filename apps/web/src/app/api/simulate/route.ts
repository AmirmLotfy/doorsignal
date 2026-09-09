import { NextRequest, NextResponse } from 'next/server';
import { processDoorEventToCase, activeCases } from '@doorsignal/case-engine';
import { ExpectedArrivalCandidate } from '@doorsignal/arrival-resolver';

export async function POST(req: NextRequest) {
  const { scenario } = await req.json();

  if (scenario === 'RESET') {
    activeCases.clear();
    return NextResponse.json({ status: 'reset_complete' });
  }

  const now = new Date();

  if (scenario === 'A') {
    // Scenario A: Expected Guest (Alex Rivera meeting Maya Patel at 10:30 AM)
    const candidates: ExpectedArrivalCandidate[] = [
      {
        id: 'cand_maya_interview_1030',
        siteId: 'site_northline_01',
        displayName: 'Candidate interview with Maya Patel (10:30 – 11:15)',
        intent: 'GUEST',
        windowStart: new Date(now.getTime() - 3 * 60000), // arrived 3 mins early
        windowEnd: new Date(now.getTime() + 45 * 60000),
        checkinToken: 'TOK-ALEX-1030',
        status: 'PENDING'
      }
    ];

    const resultCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_01',
        doorDeviceId: 'ring_dev_front_door_01',
        doorDeviceName: 'Front Entry',
        eventType: 'BUTTON_PRESS',
        occurredAt: now,
        checkinToken: 'TOK-ALEX-1030'
      },
      candidates
    );

    return NextResponse.json({ scenario: 'A', case: resultCase });
  }

  if (scenario === 'B') {
    // Scenario B: Package Arrival (FedEx Office Supplies)
    const candidates: ExpectedArrivalCandidate[] = [
      {
        id: 'cand_fedex_supplies',
        siteId: 'site_northline_01',
        displayName: 'Office Supplies (FedEx)',
        intent: 'DELIVERY',
        windowStart: new Date(now.getTime() - 60 * 60000),
        windowEnd: new Date(now.getTime() + 180 * 60000),
        preferredDoorId: 'ring_dev_dock_02',
        status: 'PENDING'
      }
    ];

    const resultCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_01',
        doorDeviceId: 'ring_dev_dock_02',
        doorDeviceName: 'Delivery Entrance',
        eventType: 'PACKAGE_DETECTED',
        occurredAt: now
      },
      candidates
    );

    return NextResponse.json({ scenario: 'B', case: resultCase });
  }

  if (scenario === 'C') {
    // Scenario C: Unmatched arrival (after-hours without appointment)
    const candidates: ExpectedArrivalCandidate[] = [];

    const resultCase = await processDoorEventToCase(
      {
        siteId: 'site_northline_01',
        doorDeviceId: 'ring_dev_front_door_01',
        doorDeviceName: 'Front Entry',
        eventType: 'BUTTON_PRESS',
        occurredAt: now
      },
      candidates
    );

    return NextResponse.json({ scenario: 'C', case: resultCase });
  }

  return NextResponse.json({ error: 'Invalid scenario identifier' }, { status: 400 });
}
