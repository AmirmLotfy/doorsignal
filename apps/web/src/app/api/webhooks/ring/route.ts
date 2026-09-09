import { NextRequest, NextResponse } from 'next/server';
import { handleRingWebhook } from '@doorsignal/ring-webhooks';
import { processDoorEventToCase } from '@doorsignal/case-engine';
import { ExpectedArrivalCandidate } from '@doorsignal/arrival-resolver';

// Sample demo candidate pool
const demoCandidates: ExpectedArrivalCandidate[] = [
  {
    id: 'cand_maya_interview_1030',
    siteId: 'site_northline_01',
    displayName: 'Candidate Interview with Maya Patel',
    intent: 'GUEST',
    windowStart: new Date(Date.now() - 3 * 60000), // scheduled right now / 3 mins ago
    windowEnd: new Date(Date.now() + 45 * 60000),
    checkinToken: 'TOK-ALEX-1030',
    status: 'PENDING'
  },
  {
    id: 'cand_fedex_supplies',
    siteId: 'site_northline_01',
    displayName: 'Office Supplies (FedEx)',
    intent: 'DELIVERY',
    windowStart: new Date(Date.now() - 120 * 60000),
    windowEnd: new Date(Date.now() + 180 * 60000),
    preferredDoorId: 'ring_dev_dock_02',
    status: 'PENDING'
  },
  {
    id: 'cand_ac_maintenance',
    siteId: 'site_northline_01',
    displayName: 'AC Maintenance (HVAC Pro)',
    intent: 'SERVICE',
    windowStart: new Date(Date.now() - 30 * 60000),
    windowEnd: new Date(Date.now() + 30 * 60000),
    status: 'PENDING'
  }
];

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headersRecord: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => {
    headersRecord[key] = value;
  });

  const webhookResult = await handleRingWebhook({
    headers: headersRecord,
    body: rawBody
  });

  if (webhookResult.statusCode !== 200) {
    return NextResponse.json(JSON.parse(webhookResult.body), { status: webhookResult.statusCode });
  }

  const webhookBody = JSON.parse(webhookResult.body);
  if (webhookBody.status === 'ignored_duplicate') {
    return NextResponse.json({
      webhook: webhookBody,
      message: 'Ignored duplicate webhook request'
    });
  }

  const payload = JSON.parse(rawBody);

  // Process through Case Engine
  const createdCase = await processDoorEventToCase(
    {
      siteId: 'site_northline_01',
      doorDeviceId: payload.device_id,
      doorDeviceName: payload.device_id === 'ring_dev_dock_02' ? 'Delivery Entrance' : 'Front Entry',
      eventType: payload.event_type === 'package_detected' ? 'PACKAGE_DETECTED' : 'BUTTON_PRESS',
      occurredAt: new Date(payload.created_at)
    },
    demoCandidates
  );

  return NextResponse.json({
    webhook: JSON.parse(webhookResult.body),
    case: createdCase
  });
}
