import { NextRequest, NextResponse } from 'next/server';
import { executeCaseAction } from '@doorsignal/case-engine';
import { CaseActionType } from '@doorsignal/arrival-schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const body = await req.json();
  const action = body.action as CaseActionType;

  if (!action) {
    return NextResponse.json({ error: 'Missing action in request body' }, { status: 400 });
  }

  const updatedCase = executeCaseAction(caseId, action, 'Maya Patel');
  if (!updatedCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, case: updatedCase });
}
