import { NextRequest, NextResponse } from 'next/server';
import { ArrivalIntentSchema } from '@doorsignal/arrival-schema';
import { ExpectedArrivalCandidate } from '@doorsignal/arrival-resolver';
import { externalExpectedArrivals } from './store';

/**
 * GET /api/v1/expected-arrivals
 * Query scheduled visits, deliveries, or work orders.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('site_id') || 'site_northline_01';
  const intent = searchParams.get('intent');

  let list = Array.from(externalExpectedArrivals.values()).filter(
    (item) => item.siteId === siteId
  );

  if (intent) {
    list = list.filter((item) => item.intent === intent);
  }

  return NextResponse.json({
    object: 'list',
    data: list,
    has_more: false,
    total_count: list.length
  });
}

/**
 * POST /api/v1/expected-arrivals
 * External systems (ATS, ERP, Property Management, Delivery) register expected arrival intents.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      site_id = 'site_northline_01',
      display_name,
      intent,
      window_start,
      window_end,
      checkin_token,
      preferred_door_id
    } = body;

    if (!display_name || !intent || !window_start || !window_end) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Missing required parameters: display_name, intent, window_start, window_end'
        },
        { status: 400 }
      );
    }

    const parsedIntent = ArrivalIntentSchema.safeParse(intent);
    if (!parsedIntent.success) {
      return NextResponse.json(
        {
          error: 'invalid_intent',
          message: `Invalid arrival intent '${intent}'. Must be one of GUEST, DELIVERY, SERVICE, PICKUP, UNMATCHED.`
        },
        { status: 400 }
      );
    }

    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newExpected: ExpectedArrivalCandidate = {
      id,
      siteId: site_id,
      displayName: display_name,
      intent: parsedIntent.data,
      windowStart: new Date(window_start),
      windowEnd: new Date(window_end),
      checkinToken: checkin_token || null,
      preferredDoorId: preferred_door_id || null,
      status: 'PENDING'
    };

    externalExpectedArrivals.set(id, newExpected);

    return NextResponse.json(
      {
        object: 'expected_arrival',
        id,
        site_id,
        display_name,
        intent: parsedIntent.data,
        window_start: newExpected.windowStart.toISOString(),
        window_end: newExpected.windowEnd.toISOString(),
        checkin_token: newExpected.checkinToken,
        status: 'PENDING',
        created_at: new Date().toISOString()
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'server_error', message: (err as Error).message },
      { status: 500 }
    );
  }
}
