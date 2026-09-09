import { NextResponse } from 'next/server';
import { activeCases } from '@doorsignal/case-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const casesArray = Array.from(activeCases.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    cases: casesArray,
    activeArrival: casesArray.find((c) => c.status !== 'RESOLVED') || null
  });
}
