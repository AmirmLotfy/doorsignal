'use client';

import React, { useState } from 'react';
import { Badge, Card, Button, HardwareLed } from '@doorsignal/ui';
import { 
  GitBranch, 
  Check, 
  Plus, 
  ShieldCheck, 
  Lightning, 
  ArrowRight, 
  SlidersHorizontal,
  Power,
  Cpu
} from '@phosphor-icons/react';

interface WorkflowRule {
  id: string;
  code: string;
  name: string;
  armed: boolean;
  trigger: string;
  triggerType: string;
  conditions: string[];
  actions: string[];
  guardrail?: string;
  cycleCount: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([
    {
      id: 'wf_guest',
      code: 'RLY-01',
      name: 'Expected Visitor & Candidate Dispatch',
      armed: true,
      triggerType: 'OPTICAL_RING_PRESS',
      trigger: 'Ring Button Press or Motion with Arrival Intent = GUEST',
      conditions: [
        'MATCH_STATUS == EXPECTED_GUEST',
        'TIME_WINDOW == SCHEDULED_SLOT (±30m)',
        'DESTINATION_SITE == 32_MERCER_ST'
      ],
      actions: [
        'DISPATCH_PUSH: Scheduled Host (Maya Patel / Recruiting Lead)',
        'HYDRATE_PWA: Broadcast arrival timestamp to visitor token session',
        'WATCHDOG_TIMER: Escalate to Studio Reception desk after 240s unacknowledged'
      ],
      guardrail: 'Host-scoped routing only. Unrelated team channels are not notified.',
      cycleCount: 142
    },
    {
      id: 'wf_package',
      code: 'RLY-02',
      name: 'Freight & Courier Delivery Intake',
      armed: true,
      triggerType: 'CARRIER_BARCODE_OR_PRESS',
      trigger: 'Package detected or Freight Bay button press',
      conditions: [
        'ARRIVAL_INTENT == DELIVERY',
        'CARRIER_MANIFEST_MATCH == PENDING_PARCEL'
      ],
      actions: [
        'CREATE_RECORD: Append parcel to active delivery manifest',
        'DISPATCH_STATION: Alert Operations Dispatch Lead (Sarah Chen)',
        'AUTOREMIND_CRON: Trigger secondary sweep notice at T+3h if uncollected'
      ],
      cycleCount: 89
    },
    {
      id: 'wf_unmatched',
      code: 'RLY-03',
      name: 'After-Hours Unmatched Sentinel',
      armed: true,
      triggerType: 'PIR_AFTER_HOURS',
      trigger: 'Button press or sensor trip outside business hours (08:30 – 18:30)',
      conditions: [
        'SCHEDULED_RESERVATION == NONE_FOUND',
        'ARRIVAL_INTENT == UNMATCHED'
      ],
      actions: [
        'ESCALATE_TELEMETRY: Route high-priority alert to Operations On-Call supervisor',
        'STREAM_PIPELINE: Render instant 15-minute receive-only WHEP audio/video feed',
        'EXPIRATION_TTL: Automatically archive and clear telemetry card after 900s if dismissed'
      ],
      guardrail: 'CRITICAL SAFETY INTERLOCK: Automated physical door-strike energize/unlock is firmware-blocked. Manual physical check required.',
      cycleCount: 18
    }
  ]);

  const toggleRelay = (id: string) => {
    setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, armed: !wf.armed } : wf));
  };

  return (
    <div className="space-y-6">
      {/* Industrial Rack Header */}
      <div className="border-b-2 border-alloy pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-signal-vermilion rounded-none"></span>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
              OPERATIONAL LOGIC MATRIX // AGENTCORE DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-carbon mt-1 font-sans">
            Workflows & Relay Logic
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Hardware-triggered deterministic rules and automated operational dispatch sequences.
          </p>
        </div>

        {/* Machine Status Readout & Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-porcelain border border-alloy px-3 py-1.5 rounded-[4px] shadow-well flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <HardwareLed state="active" size="sm" />
              <span className="font-mono text-[11px] font-bold text-field-teal">RELAYS ARMED: {workflows.filter(w => w.armed).length}/{workflows.length}</span>
            </div>
            <span className="text-alloy">|</span>
            <span className="font-mono text-[10px] text-slate">CYCLE: 100ms</span>
          </div>

          <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
            <Plus size={14} weight="bold" /> New Logic Relay
          </Button>
        </div>
      </div>

      {/* Rack System Overview Banner */}
      <div className="bg-porcelain border border-alloy p-4 rounded-[4px] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-carbon text-parchment flex items-center justify-center font-mono font-bold text-xs shadow-bevel-dark">
            <Cpu size={18} />
          </div>
          <div>
            <div className="font-mono font-bold text-carbon uppercase tracking-wider text-[11px]">
              ENGINE INTERLOCK STATUS: SAFE
            </div>
            <div className="text-slate text-[11px]">
              Ring Webhook payload parsing → Arrival Intent resolution → Workflow execution in &lt;140ms.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="signal" size="sm" withDot>
            RING FIRMWARE VERIFIED
          </Badge>
          <Badge variant="outline" size="sm">
            NO BIOMETRICS
          </Badge>
        </div>
      </div>

      {/* Relays List styled as Machined Industrial Plates */}
      <div className="space-y-4">
        {workflows.map((wf) => (
          <Card 
            key={wf.id} 
            withCornerTicks 
            className={`p-5 transition-colors border-2 ${wf.armed ? 'border-alloy bg-porcelain' : 'border-dashed border-alloy/70 bg-parchment/60 opacity-80'}`}
          >
            {/* Top Plate Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-alloy">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[3px] bg-carbon text-parchment shadow-bevel-dark">
                  {wf.code}
                </span>
                <div>
                  <h2 className="text-base font-bold text-carbon tracking-tight">{wf.name}</h2>
                  <div className="font-mono text-[11px] text-field-teal flex items-center gap-1.5 mt-0.5">
                    <Lightning size={12} weight="fill" />
                    <span>TRIGGER: {wf.trigger}</span>
                  </div>
                </div>
              </div>

              {/* Armed / Bypass Tactile Toggle */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="font-mono text-[10px] text-slate">CYCLES: {wf.cycleCount}</span>
                <button
                  onClick={() => toggleRelay(wf.id)}
                  className={`px-3 py-1 rounded-[3px] font-mono text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm active:translate-y-[1px] ${
                    wf.armed 
                      ? 'bg-porcelain border-field-teal text-field-teal hover:bg-parchment' 
                      : 'bg-parchment border-slate/40 text-slate hover:bg-porcelain'
                  }`}
                >
                  <HardwareLed state={wf.armed ? 'active' : 'inactive'} size="sm" />
                  <span>{wf.armed ? 'ARMED' : 'BYPASSED'}</span>
                </button>
              </div>
            </div>

            {/* Three-Stage Logic Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-4 text-xs">
              {/* Stage 1: Trigger Specification */}
              <div className="lg:col-span-4 bg-parchment/80 p-3.5 rounded-[3px] border border-alloy space-y-2">
                <div className="flex items-center justify-between border-b border-alloy/60 pb-1.5">
                  <span className="font-mono font-bold text-[10px] text-slate uppercase tracking-wider">
                    STAGE 01 // INPUT SENSOR
                  </span>
                  <span className="font-mono text-[10px] text-field-teal font-semibold">SIG_CH</span>
                </div>
                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] font-semibold text-carbon bg-porcelain p-2 rounded-[3px] border border-alloy/80">
                    {wf.triggerType}
                  </div>
                  <div className="text-[11px] text-slate leading-relaxed">
                    Evaluates incoming Ring doorbell push notifications, motion detection vectors, and optional QR check-in tokens.
                  </div>
                </div>
              </div>

              {/* Stage 2: Logic Gates (IF Conditions) */}
              <div className="lg:col-span-4 bg-parchment/80 p-3.5 rounded-[3px] border border-alloy space-y-2">
                <div className="flex items-center justify-between border-b border-alloy/60 pb-1.5">
                  <span className="font-mono font-bold text-[10px] text-slate uppercase tracking-wider">
                    STAGE 02 // LOGIC GATES (IF)
                  </span>
                  <span className="font-mono text-[10px] text-amber-700 font-semibold">AND LADDER</span>
                </div>
                <ul className="space-y-1.5 font-mono text-[11px]">
                  {wf.conditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-2 bg-porcelain p-1.5 rounded-[3px] border border-alloy/60 text-carbon">
                      <span className="text-field-teal font-bold select-none">[G{i + 1}]</span>
                      <span className="break-all">{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stage 3: Output Relays (THEN Actions) */}
              <div className="lg:col-span-4 bg-parchment/80 p-3.5 rounded-[3px] border border-alloy space-y-2">
                <div className="flex items-center justify-between border-b border-alloy/60 pb-1.5">
                  <span className="font-mono font-bold text-[10px] text-slate uppercase tracking-wider">
                    STAGE 03 // DISPATCH (THEN)
                  </span>
                  <span className="font-mono text-[10px] text-field-teal font-semibold">OUT RELAYS</span>
                </div>
                <ul className="space-y-1.5 font-mono text-[11px]">
                  {wf.actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 bg-porcelain p-1.5 rounded-[3px] border border-alloy/60 text-carbon">
                      <Check size={12} className="text-field-teal mt-0.5 shrink-0" weight="bold" />
                      <span className="leading-snug">{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hardware Interlock / Guardrail Policy */}
            {wf.guardrail && (
              <div className={`mt-3 p-2.5 rounded-[3px] border text-xs font-mono flex items-start gap-2.5 ${
                wf.guardrail.includes('CRITICAL') 
                  ? 'bg-[#FDF0EC] border-signal-vermilion/40 text-signal-vermilion' 
                  : 'bg-porcelain border-alloy text-slate'
              }`}>
                <ShieldCheck size={16} className={`shrink-0 mt-0.5 ${wf.guardrail.includes('CRITICAL') ? 'text-signal-vermilion' : 'text-field-teal'}`} />
                <span className="leading-tight text-[11px]">{wf.guardrail}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

