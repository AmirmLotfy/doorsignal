'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Card, HardwareLed } from '@doorsignal/ui';

interface ArrivalLedgerItem {
  id: string;
  time: string;
  caseNumber: string;
  intent: 'GUEST' | 'DELIVERY' | 'SERVICE' | 'PICKUP' | 'UNMATCHED';
  title: string;
  owner: string;
  outcome: string;
  status: 'RESOLVED' | 'ROUTED' | 'ACKNOWLEDGED' | 'MATCHED' | 'UNMATCHED';
  door: string;
}

const seedLedgerItems: ArrivalLedgerItem[] = [
  {
    id: 'seed-1',
    time: '10:27:14 AM',
    caseNumber: 'DS-1042',
    intent: 'GUEST',
    title: 'Candidate Interview · Alex Rivera',
    owner: 'Maya Patel (Talent)',
    outcome: 'Resolved · 10:31 AM (Host acknowledged on-site)',
    status: 'RESOLVED',
    door: 'Front Entry'
  },
  {
    id: 'seed-2',
    time: '09:18:22 AM',
    caseNumber: 'DS-1041',
    intent: 'DELIVERY',
    title: 'Office Supplies (FedEx) · Restock',
    owner: 'Sarah Chen (Ops)',
    outcome: 'Collected · 11:42 AM',
    status: 'RESOLVED',
    door: 'Delivery Entrance'
  },
  {
    id: 'seed-3',
    time: '08:54:10 AM',
    caseNumber: 'DS-1040',
    intent: 'GUEST',
    title: 'Client Meeting · Branding Presentation',
    owner: 'Oliver Vance (Director)',
    outcome: 'Resolved · 09:02 AM',
    status: 'RESOLVED',
    door: 'Front Entry'
  },
  {
    id: 'seed-4',
    time: 'Yesterday 04:12 PM',
    caseNumber: 'DS-1039',
    intent: 'SERVICE',
    title: 'Fire Alarm Safety Inspection',
    owner: 'Operations Team',
    outcome: 'Resolved · 04:45 PM',
    status: 'RESOLVED',
    door: 'Front Entry'
  },
  {
    id: 'seed-5',
    time: 'Yesterday 07:46 PM',
    caseNumber: 'DS-1038',
    intent: 'UNMATCHED',
    title: 'Unmatched arrival (After-hours sensor trigger)',
    owner: 'On-Call Supervisor',
    outcome: 'Dismissed by on-call supervisor after live review',
    status: 'RESOLVED',
    door: 'Front Entry'
  }
];

export default function ArrivalsPage() {
  const [filter, setFilter] = useState<string>('ALL');
  const [dynamicCases, setDynamicCases] = useState<ArrivalLedgerItem[]>([]);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (Array.isArray(data.cases)) {
        const mapped: ArrivalLedgerItem[] = data.cases.map((c: any) => {
          const createdAt = new Date(c.createdAt);
          const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const owner = c.intent === 'GUEST' ? 'Maya Patel' : c.intent === 'DELIVERY' ? 'Sarah Chen' : 'Operations On-Call';
          const outcome = c.status === 'RESOLVED' 
            ? 'Resolved · Complete' 
            : c.status === 'ROUTED' 
            ? `Routed · ${owner} notified` 
            : c.status === 'ACKNOWLEDGED'
            ? 'Acknowledged · Host on the way'
            : c.status === 'MATCHED'
            ? `Matched (${Math.round((c.confidenceInternal || 0.9) * 100)}% conf)`
            : 'Unmatched arrival';

          return {
            id: c.id,
            time: timeStr,
            caseNumber: c.caseNumber,
            intent: c.intent,
            title: c.candidatesList?.[0]?.displayName || c.matchReason || 'Arrival Event',
            owner,
            outcome,
            status: c.status,
            door: c.deviceName || 'Front Entry'
          };
        });
        setDynamicCases(mapped);
      }
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 2500);

    const onScenario = () => {
      fetchCases();
    };
    window.addEventListener('doorsignal:scenario-triggered', onScenario);

    return () => {
      clearInterval(interval);
      window.removeEventListener('doorsignal:scenario-triggered', onScenario);
    };
  }, []);

  const allLedgerItems = [...dynamicCases, ...seedLedgerItems];
  const filteredItems = allLedgerItems.filter((item) => {
    if (filter === 'ALL') return true;
    return item.intent === filter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between border-b border-[#D2D8D4] pb-4 gap-4">
        <div>
          <div className="font-mono text-[11px] font-semibold text-[#5C6966] tracking-wider uppercase">
            AUDITABLE EVENT LOGBOOK // CH-02
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121817] mt-1">
            Arrivals Ledger
          </h1>
        </div>

        {/* Physical Multi-Position Channel Filter Switch */}
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded border border-[#D2D8D4] font-mono text-xs">
          {['ALL', 'GUEST', 'DELIVERY', 'SERVICE', 'PICKUP', 'UNMATCHED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all active:translate-y-[1px] ${
                filter === f
                  ? 'bg-[#121817] text-[#FDFAF5] shadow-bevel-dark'
                  : 'text-[#5C6966] hover:text-[#121817]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabular Archival Ledger */}
      <Card className="overflow-hidden border border-[#D2D8D4] bg-[#FDFAF5] shadow-sm">
        <div className="divide-y divide-[#D2D8D4]">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-wrap items-center justify-between hover:bg-[#F5F2EB]/60 transition-colors gap-3"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-semibold text-[#5C6966] w-24 tabular-nums">
                  {item.time}
                </span>

                <div className="w-24">
                  {item.intent === 'GUEST' && <Badge variant="teal">GUEST</Badge>}
                  {item.intent === 'DELIVERY' && <Badge variant="amber">DELIVERY</Badge>}
                  {item.intent === 'SERVICE' && <Badge variant="amber">SERVICE</Badge>}
                  {item.intent === 'PICKUP' && <Badge variant="sage">PICKUP</Badge>}
                  {item.intent === 'UNMATCHED' && <Badge variant="vermilion">UNMATCHED</Badge>}
                </div>

                <div>
                  <div className="font-bold text-sm text-[#121817]">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#5C6966] flex items-center gap-2 mt-0.5">
                    <span>Door: {item.door}</span>
                    <span>·</span>
                    <span>Owner: {item.owner}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono">
                <span className="text-xs text-[#5C6966]">
                  {item.outcome}
                </span>
                <span className="text-[11px] text-[#12756A] bg-[#E6F3F1] px-2 py-0.5 rounded border border-[#B8DFDA] font-bold">
                  {item.caseNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
