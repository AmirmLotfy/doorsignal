import { NextRequest, NextResponse } from 'next/server';
import { activeCases, executeCaseAction } from '@doorsignal/case-engine';

/**
 * POST /api/v1/arrival-cases/:id/resolve
 * Conclude an Arrival Case with resolution metadata.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const body = await req.json().catch(() => ({}));
    const actor = body.resolved_by || 'API Client';
    const notes = body.notes || 'Programmatically resolved via DoorSignal v1 API';

    const existing = activeCases.get(caseId);
    if (!existing) {
      return NextResponse.json(
        { error: 'not_found', message: `Arrival case '${caseId}' was not found.` },
        { status: 404 }
      );
    }

    const updated = executeCaseAction(caseId, 'DISMISS', actor);

    return NextResponse.json({
      object: 'arrival_case_resolution',
      case_id: caseId,
      case_number: existing.caseNumber,
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      resolved_by: actor,
      notes
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'server_error', message: (err as Error).message },
      { status: 500 }
    );
  }
}
