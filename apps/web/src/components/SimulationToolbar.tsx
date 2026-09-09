'use client';

import React, { useState } from 'react';
import { HardwareLed } from '@doorsignal/ui';
import { ArrowsClockwise, TerminalWindow } from '@phosphor-icons/react';

export interface SimulationToolbarProps {
  onScenarioTriggered?: () => void;
}

export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({ onScenarioTriggered }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerScenario = async (scenario: 'A' | 'B' | 'C' | 'RESET') => {
    setLoading(scenario);
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('doorsignal:scenario-triggered', { detail: { scenario } }));
      }
      onScenarioTriggered?.();
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <header className="bg-[#121817] text-[#FDFAF5] px-4 py-2 text-xs border-b border-black select-none shadow-well">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Rackmount Chassis Label & Hardware Telemetry */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-2 border-r border-[#5C6966]/40 pr-3">
            <HardwareLed status="lit" color="teal" size="sm" />
            <span className="font-bold tracking-wider uppercase text-[11px] text-[#FDFAF5]">
              DOORSIGNAL // RACK-01
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-[#5C6966]">
            <span>BUS: EVENTBRIDGE</span>
            <span>·</span>
            <span>AI: AGENTCORE + NOVA</span>
            <span>·</span>
            <span className="text-[#12756A] font-bold">24ms LOOP</span>
          </div>
        </div>

        {/* Tactile Hardware Channel Switches */}
        <div className="flex items-center gap-1.5 font-mono">
          <button
            onClick={() => triggerScenario('A')}
            disabled={!!loading}
            className="h-7 px-2.5 rounded bg-[#1A2221] hover:bg-[#232D2B] active:bg-[#0E1312] active:translate-y-[1px] border border-[#5C6966]/40 text-[11px] font-semibold text-[#FDFAF5] flex items-center gap-1.5 transition-all shadow-bevel-dark disabled:opacity-40"
          >
            <HardwareLed status={loading === 'A' ? 'pulsing' : 'lit'} color="teal" size="sm" />
            <span>{loading === 'A' ? 'CH-01 // FIRING...' : 'CH-01 // INTERVIEW'}</span>
          </button>

          <button
            onClick={() => triggerScenario('B')}
            disabled={!!loading}
            className="h-7 px-2.5 rounded bg-[#1A2221] hover:bg-[#232D2B] active:bg-[#0E1312] active:translate-y-[1px] border border-[#5C6966]/40 text-[11px] font-semibold text-[#FDFAF5] flex items-center gap-1.5 transition-all shadow-bevel-dark disabled:opacity-40"
          >
            <HardwareLed status={loading === 'B' ? 'pulsing' : 'lit'} color="amber" size="sm" />
            <span>{loading === 'B' ? 'CH-02 // FIRING...' : 'CH-02 // FEDEX'}</span>
          </button>

          <button
            onClick={() => triggerScenario('C')}
            disabled={!!loading}
            className="h-7 px-2.5 rounded bg-[#1A2221] hover:bg-[#232D2B] active:bg-[#0E1312] active:translate-y-[1px] border border-[#5C6966]/40 text-[11px] font-semibold text-[#FDFAF5] flex items-center gap-1.5 transition-all shadow-bevel-dark disabled:opacity-40"
          >
            <HardwareLed status={loading === 'C' ? 'pulsing' : 'lit'} color="vermilion" size="sm" />
            <span>{loading === 'C' ? 'CH-03 // FIRING...' : 'CH-03 // UNMATCHED'}</span>
          </button>

          <button
            onClick={() => triggerScenario('RESET')}
            disabled={!!loading}
            title="Purge Active Arrival / Reset to Quiet State"
            className="h-7 w-7 rounded bg-[#1A2221] hover:bg-[#232D2B] active:bg-[#0E1312] active:translate-y-[1px] border border-[#5C6966]/40 text-[#5C6966] hover:text-[#FDFAF5] flex items-center justify-center transition-all shadow-bevel-dark disabled:opacity-40 ml-1"
          >
            <ArrowsClockwise size={13} className={loading === 'RESET' ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
};
