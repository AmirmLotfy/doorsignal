import { 
  filterViableCandidates, 
  scoreCandidate, 
  ArrivalEventContext, 
  ExpectedArrivalCandidate,
  CandidateScoringResult 
} from '../deterministic';
import { ResolverAgentTools, ToolExecutionTrace } from './tools';
import { evaluateAgentPolicy } from './policies';
import { ArrivalIntent } from '@doorsignal/arrival-schema';

export interface ArrivalResolutionResult {
  intent: ArrivalIntent;
  matchedExpectedArrivalId: string | null;
  matchReason: string;
  confidenceInternal: number;
  candidates: CandidateScoringResult[];
  agentTraces: ToolExecutionTrace[];
}

export async function resolveArrival(
  event: ArrivalEventContext,
  availableCandidates: ExpectedArrivalCandidate[]
): Promise<ArrivalResolutionResult> {
  const tools = new ResolverAgentTools();

  // Stage 1: Deterministic filter
  const viable = filterViableCandidates(availableCandidates, event);

  // Stage 2: Contextual Heuristic Scoring
  const scored = viable
    .map((c) => scoreCandidate(c, event))
    .sort((a, b) => b.score - a.score);

  // Stage 3: Decision & Agentic Evaluation
  if (scored.length === 0) {
    // Check if there are recent check-ins or delivery expectations via tools
    await tools.getRecentCheckins(event.siteId, 10);
    await tools.getDeliveryExpectations(event.siteId);

    // Stage 4: Policy Check (ensure no lock action is taken on unmatched arrival)
    evaluateAgentPolicy({
      toolName: 'route_case',
      parameters: { status: 'UNMATCHED' },
      context: {
        arrivalCaseId: 'new',
        intent: 'UNMATCHED',
        isIdentified: false
      }
    });

    return {
      intent: 'UNMATCHED',
      matchedExpectedArrivalId: null,
      matchReason: 'No scheduled visit, delivery, or service appointment matches this door event.',
      confidenceInternal: 0.10,
      candidates: [],
      agentTraces: tools.getTraces()
    };
  }

  const topCandidate = scored[0];
  const runnerUp = scored[1];

  // If top candidate has a strong score (> 0.65) and clear lead over runner up
  const isClearLead = !runnerUp || (topCandidate.score - runnerUp.score >= 0.20);

  if (topCandidate.score >= 0.60 && isClearLead) {
    // Policy check before confirming route
    const policy = evaluateAgentPolicy({
      toolName: 'route_case',
      parameters: { candidateId: topCandidate.candidateId },
      context: {
        arrivalCaseId: 'new',
        intent: topCandidate.intent,
        isIdentified: true
      }
    });

    if (!policy.allowed) {
      return {
        intent: 'UNMATCHED',
        matchedExpectedArrivalId: null,
        matchReason: `Policy blocked automated match: ${policy.violationReason}`,
        confidenceInternal: 0.0,
        candidates: scored,
        agentTraces: tools.getTraces()
      };
    }

    return {
      intent: topCandidate.intent,
      matchedExpectedArrivalId: topCandidate.candidateId,
      matchReason: `Likely ${topCandidate.displayName} (${topCandidate.explanation})`,
      confidenceInternal: topCandidate.score,
      candidates: scored,
      agentTraces: tools.getTraces()
    };
  }

  // Ambiguous candidates: execute deeper tool inspection (Stage 3 AgentCore loop)
  await tools.getRecentCheckins(event.siteId, 15);
  await tools.getExpectedArrivals(event.siteId, new Date(event.occurredAt.getTime() - 15 * 60000), new Date(event.occurredAt.getTime() + 15 * 60000));

  // If still ambiguous, surface top candidate as suggestion but lower internal confidence
  return {
    intent: topCandidate.intent,
    matchedExpectedArrivalId: topCandidate.candidateId,
    matchReason: `Possible match: ${topCandidate.displayName} (${topCandidate.explanation})`,
    confidenceInternal: Math.max(0.50, topCandidate.score),
    candidates: scored,
    agentTraces: tools.getTraces()
  };
}
