import { db } from '@doorsignal/db';
import * as s from '@doorsignal/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { ArrivalIntent } from '@doorsignal/arrival-schema';

export interface ToolExecutionTrace {
  tool: string;
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  policyApproved: boolean;
}

export class ResolverAgentTools {
  private traces: ToolExecutionTrace[] = [];

  public getTraces(): ToolExecutionTrace[] {
    return this.traces;
  }

  public async getExpectedArrivals(siteId: string, windowStart: Date, windowEnd: Date) {
    const start = Date.now();
    try {
      const records = await db.select().from(s.expectedArrivals).where(
        and(
          eq(s.expectedArrivals.siteId, siteId),
          gte(s.expectedArrivals.windowEnd, windowStart),
          lte(s.expectedArrivals.windowStart, windowEnd)
        )
      );
      this.traces.push({
        tool: 'get_expected_arrivals',
        toolName: 'get_expected_arrivals',
        input: { siteId, windowStart, windowEnd },
        output: records,
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return records;
    } catch (err) {
      this.traces.push({
        tool: 'get_expected_arrivals',
        toolName: 'get_expected_arrivals',
        input: { siteId, windowStart, windowEnd },
        output: { simulatedFallback: [] },
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return [];
    }
  }

  public async getRecentCheckins(siteId: string, minutes: number = 15) {
    const start = Date.now();
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    try {
      const records = await db.select().from(s.checkins).where(
        and(
          eq(s.checkins.siteId, siteId),
          gte(s.checkins.createdAt, threshold)
        )
      );
      this.traces.push({
        tool: 'get_recent_checkins',
        toolName: 'get_recent_checkins',
        input: { siteId, minutes },
        output: records,
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return records;
    } catch (err) {
      this.traces.push({
        tool: 'get_recent_checkins',
        toolName: 'get_recent_checkins',
        input: { siteId, minutes },
        output: { simulatedFallback: [] },
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return [];
    }
  }

  public async getDeliveryExpectations(siteId: string) {
    const start = Date.now();
    try {
      const records = await db.select().from(s.deliveries).where(
        and(
          eq(s.deliveries.siteId, siteId),
          eq(s.deliveries.status, 'EXPECTED')
        )
      );
      this.traces.push({
        tool: 'get_delivery_expectations',
        toolName: 'get_delivery_expectations',
        input: { siteId },
        output: records,
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return records;
    } catch (err) {
      this.traces.push({
        tool: 'get_delivery_expectations',
        toolName: 'get_delivery_expectations',
        input: { siteId },
        output: { simulatedFallback: [] },
        durationMs: Date.now() - start,
        policyApproved: true
      });
      return [];
    }
  }
}
