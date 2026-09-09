'use client';

import React from 'react';
import { Badge, HardwareLed } from '@doorsignal/ui';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  TerminalWindow, 
  CheckCircle, 
  Lightning,
  Eye,
  ArrowsClockwise
} from '@phosphor-icons/react';

export interface AgentTraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
  intent?: string;
  deviceName?: string;
  matchScore?: number;
}

export const AgentTraceDrawer: React.FC<AgentTraceDrawerProps> = ({
  isOpen,
  onClose,
  caseNumber = 'DS-1042',
  intent = 'GUEST',
  deviceName = 'Front Entry',
  matchScore = 95
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-porcelain border-l-2 border-carbon h-full overflow-y-auto flex flex-col justify-between shadow-2xl animate-slideLeft"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b-2 border-alloy bg-parchment">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-signal-vermilion"></span>
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                  AWS BEDROCK AGENTCORE // TRACE INSPECTOR
                </span>
              </div>
              <h2 className="text-lg font-bold text-carbon tracking-tight mt-1 font-sans">
                Arrival Resolution Trace · {caseNumber}
              </h2>
              <div className="font-mono text-xs text-slate mt-0.5">
                SESSION: trc_bedrock_agentcore_8921 // LATENCY: 312ms p95
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-7 h-7 rounded border border-alloy flex items-center justify-center text-slate hover:text-carbon hover:border-carbon transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 font-mono">
            <Badge variant="teal" size="sm" withDot>
              RUNTIME: AGENTCORE
            </Badge>
            <Badge variant="neutral" size="sm">
              MODEL: NOVA 2 LITE
            </Badge>
            <Badge variant="neutral" size="sm">
              POLICY: ENFORCED
            </Badge>
          </div>
        </div>

        {/* Trace Waterfall Steps */}
        <div className="p-5 space-y-4 flex-1">
          <div className="text-[10px] font-mono font-bold text-slate uppercase tracking-wider">
            Resolution Pipeline Execution Graph
          </div>

          {/* Step 1: Ingest */}
          <div className="border border-alloy rounded-[3px] p-3.5 bg-[#F5F2EB] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[#12756A] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#12756A] text-[#FDFAF5] flex items-center justify-center text-[10px]">1</span>
                <span>EVENTBRIDGE WEBHOOK INGEST</span>
              </div>
              <span className="text-[10px] text-slate">18ms</span>
            </div>
            <p className="text-[11px] text-carbon font-sans pl-6">
              Ring Partner API webhook authenticated via HMAC-SHA256 signature. Idempotency key validated against DynamoDB (24h TTL).
            </p>
            <div className="pl-6 text-[10px] text-slate">
              DEVICE: {deviceName} · EVENT: BUTTON_PRESS
            </div>
          </div>

          {/* Step 2: Nova 2 Lite Coarse Vision */}
          <div className="border border-alloy rounded-[3px] p-3.5 bg-[#F5F2EB] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[#12756A] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#12756A] text-[#FDFAF5] flex items-center justify-center text-[10px]">2</span>
                <span>AMAZON NOVA 2 LITE MULTIMODAL INFERENCE</span>
              </div>
              <span className="text-[10px] text-slate">142ms</span>
            </div>
            <p className="text-[11px] text-carbon font-sans pl-6">
              Processed receive-only doorway snapshot for coarse scene elements. Zero biometrics evaluated.
            </p>
            <div className="pl-6 text-[10px] text-carbon bg-porcelain p-2 rounded border border-alloy">
              {JSON.stringify({ person_present: true, person_count: 1, package_present: intent === 'DELIVERY', vehicle_present: false }, null, 2)}
            </div>
          </div>

          {/* Step 3: Deterministic & Heuristic Filter */}
          <div className="border border-alloy rounded-[3px] p-3.5 bg-[#F5F2EB] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[#12756A] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#12756A] text-[#FDFAF5] flex items-center justify-center text-[10px]">3</span>
                <span>STAGE 1 & 2 DETERMINISTIC + CONTEXT SCORING</span>
              </div>
              <span className="text-[10px] text-slate">24ms</span>
            </div>
            <p className="text-[11px] text-carbon font-sans pl-6">
              Scanned active site expectations (±30m). Evaluated candidate fit:
            </p>
            <div className="pl-6 space-y-1 text-[11px] text-slate">
              <div>· Token match factor: <span className="font-bold text-carbon">0.40</span></div>
              <div>· Time proximity factor: <span className="font-bold text-carbon">0.25</span></div>
              <div>· Site & door compatibility: <span className="font-bold text-carbon">0.25</span></div>
              <div>· Composite score: <span className="font-bold text-[#12756A]">{matchScore}% confidence</span></div>
            </div>
          </div>

          {/* Step 4: Strands Tool Calling */}
          <div className="border border-alloy rounded-[3px] p-3.5 bg-[#F5F2EB] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[#12756A] font-bold">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#12756A] text-[#FDFAF5] flex items-center justify-center text-[10px]">4</span>
                <span>STRANDS AGENT TOOL EXECUTION</span>
              </div>
              <span className="text-[10px] text-slate">86ms</span>
            </div>
            <p className="text-[11px] text-carbon font-sans pl-6">
              Executed Bedrock AgentCore tools in sandboxed runtime:
            </p>
            <div className="pl-6 space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5 text-carbon">
                <CheckCircle size={12} className="text-[#12756A]" weight="fill" />
                <span>tool: <strong className="font-mono">get_expected_arrivals(site_id)</strong> → 1 candidate matched</span>
              </div>
              <div className="flex items-center gap-1.5 text-carbon">
                <CheckCircle size={12} className="text-[#12756A]" weight="fill" />
                <span>tool: <strong className="font-mono">get_recent_checkins(site_id)</strong> → Verified QR token</span>
              </div>
            </div>
          </div>

          {/* Step 5: AgentCore Policy Guardrails */}
          <div className="border-2 border-signal-teal rounded-[3px] p-3.5 bg-[#E6F3F1] space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-signal-teal font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} weight="fill" />
                <span>STAGE 4 AGENTCORE POLICY VERIFICATION</span>
              </div>
              <span className="text-[10px]">PASSED</span>
            </div>
            <div className="space-y-1 text-[11px] text-carbon font-sans pl-6">
              <div>✓ <span className="font-semibold">Negative Lock Guardrail</span>: No automated door-release requested.</div>
              <div>✓ <span className="font-semibold">Zero-Biometric Guardrail</span>: Facial recognition endpoints blocked.</div>
              <div>✓ <span className="font-semibold">Calendar Privacy Shield</span>: Unrelated meeting details shielded.</div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-alloy bg-parchment flex items-center justify-between font-mono text-xs">
          <span className="text-slate">TRACE EXPORT: CLOUDWATCH // X-RAY</span>
          <button 
            onClick={onClose}
            className="px-3 py-1.5 bg-carbon text-parchment rounded text-xs hover:opacity-90 font-bold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
