import { NextRequest, NextResponse } from 'next/server';
import { activeCases, executeCaseAction } from '@doorsignal/case-engine';
import { CaseActionType } from '@doorsignal/arrival-schema';

/**
 * GET /api/v1/arrival-cases/:id
 * Query an Arrival Case's full telemetry, candidates, and resolution status.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const c = activeCases.get(caseId);

  if (!c) {
    return NextResponse.json(
      { error: 'not_found', message: `Arrival case '${caseId}' was not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    object: 'arrival_case',
    id: c.id,
    case_number: c.caseNumber,
    site_id: c.siteId,
    device_name: c.deviceName,
    intent: c.intent,
    status: c.status,
    match_reason: c.matchReason,
    confidence_internal: c.confidenceInternal,
    candidates: c.candidatesList || [],
    actions_history: c.actionsHistory || [],
    created_at: c.createdAt.toISOString(),
    resolved_at: c.resolvedAt ? c.resolvedAt.toISOString() : null
  });
}

/**
 * POST /api/v1/arrival-cases/:id
 * Apply an action or state transition to an arrival case.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const body = await req.json();
    const action = body.action as CaseActionType;
    const actor = body.actor || 'API Client';

    if (!action) {
      return NextResponse.json(
        { error: 'invalid_request', message: "Missing required parameter 'action'." },
        { status: 400 }
      );
    }

    const updated = executeCaseAction(caseId, action, actor);
    if (!updated) {
      return NextResponse.json(
        { error: 'not_found', message: `Arrival case '${caseId}' was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      object: 'arrival_case',
      id: updated.id,
      case_number: updated.caseNumber,
      status: updated.status,
      intent: updated.intent,
      resolved_at: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
      actions_history: updated.actionsHistory
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'server_error', message: (err as Error).message },
      { status: 500 }
    );
  }
}
