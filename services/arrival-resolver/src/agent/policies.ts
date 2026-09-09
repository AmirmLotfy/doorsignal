export interface AgentActionRequest {
  toolName: string;
  parameters: Record<string, unknown>;
  context: {
    arrivalCaseId: string;
    intent: string;
    isIdentified: boolean;
  };
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  violationReason?: string;
}

/**
 * AgentCore Policy Hard Constraints:
 * 1. An unknown visitor cannot trigger access or unlock actions.
 * 2. Media cannot be passed to any facial recognition or biometric tool.
 * 3. Delivery case resolution cannot inspect unrelated employee calendar attendee details.
 * 4. Human consequential control: DoorSignal Agent can only route notifications, never operate locks.
 */
export function evaluateAgentPolicy(req: AgentActionRequest): PolicyEvaluationResult {
  // Rule 1: Zero smart-lock / unlock automation
  const lowerTool = req.toolName.toLowerCase();
  if (lowerTool.includes('unlock') || lowerTool.includes('door_release') || lowerTool.includes('access_grant')) {
    return {
      allowed: false,
      violationReason: 'AgentCore Policy Violation: Automated physical access/unlock actions are strictly prohibited.'
    };
  }

  // Rule 2: Zero biometric identification
  if (lowerTool.includes('face') || lowerTool.includes('biometric') || lowerTool.includes('recognize_person')) {
    return {
      allowed: false,
      violationReason: 'AgentCore Policy Violation: Zero-biometric architecture. Identity recognition via facial analysis is strictly prohibited.'
    };
  }

  // Rule 3: Calendar privacy shield for deliveries
  if (req.context.intent === 'DELIVERY' && lowerTool.includes('calendar')) {
    if (req.parameters.includeAttendeeDetails === true || req.parameters.queryPrivateMeetings === true) {
      return {
        allowed: false,
        violationReason: 'AgentCore Policy Violation: Delivery cases cannot inspect private calendar details.'
      };
    }
  }

  return { allowed: true };
}
