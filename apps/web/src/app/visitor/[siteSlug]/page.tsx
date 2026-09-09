'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, HardwareLed } from '@doorsignal/ui';
import { 
  Users, 
  Package, 
  Wrench, 
  Handbag, 
  CheckCircle,
  ArrowLeft,
  Clock,
  QrCode,
  ShieldCheck,
  Building,
  SealCheck
} from '@phosphor-icons/react';

export default function VisitorCheckinPage({
  params
}: {
  params: { siteSlug: string };
}) {
  const [step, setStep] = useState<'INTENT' | 'MEETING_HOST' | 'CONFIRMED'>('INTENT');
  const [selectedIntent, setSelectedIntent] = useState<string>('');
  const [visitorName, setVisitorName] = useState('');
  const [hostSelected, setHostSelected] = useState('Maya Patel');
  const [checkinTime, setCheckinTime] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIntentSelect = (intent: string) => {
    setSelectedIntent(intent);
    if (intent === 'MEETING') {
      setStep('MEETING_HOST');
    } else {
      const now = new Date();
      setCheckinTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setStep('CONFIRMED');
    }
  };

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    setCheckinTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setStep('CONFIRMED');
  };

  return (
    <div className="min-h-screen bg-parchment text-carbon flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto selection:bg-field-teal selection:text-white">
      {/* Top Architectural Masthead Plate */}
      <div className="space-y-6">
        <header className="border-2 border-alloy bg-porcelain p-4 rounded-[4px] shadow-sm relative corner-ticks">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-signal-vermilion rounded-none"></span>
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                  DOORSIGNAL ARCHITECTURAL DIRECTORY
                </span>
              </div>
              <h1 className="font-sans font-bold text-lg text-carbon tracking-tight mt-1">
                Northline Studio
              </h1>
              <div className="font-mono text-xs text-slate mt-0.5">
                32 Mercer Street · New York, NY 10013
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="flex items-center gap-1.5 justify-end">
                <HardwareLed state="active" size="sm" />
                <span className="text-[10px] font-bold text-field-teal">LIVE</span>
              </div>
              <div className="text-[11px] font-bold text-carbon tabular-nums mt-0.5">
                {currentTime || '12:00:00'}
              </div>
            </div>
          </div>
        </header>

        {/* Step 1: Intent Selection Plate */}
        {step === 'INTENT' && (
          <div className="space-y-4">
            <div className="px-1">
              <div className="font-mono text-[10px] font-bold text-slate uppercase tracking-wider">
                STEP 01 // SELECT ARRIVAL REASON
              </div>
              <h2 className="text-xl font-bold tracking-tight text-carbon mt-0.5">
                What brings you to Northline?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  code: '01',
                  key: 'MEETING',
                  title: 'Scheduled Appointment',
                  desc: 'Candidate interview, client meeting, or booked tour',
                  icon: Users,
                  tag: 'HOST ROUTED'
                },
                {
                  code: '02',
                  key: 'DELIVERY',
                  title: 'Delivery / Courier Drop-off',
                  desc: 'FedEx, UPS, courier, freight, or catering intake',
                  icon: Package,
                  tag: 'DISPATCH RACK'
                },
                {
                  code: '03',
                  key: 'SERVICE',
                  title: 'Facilities / Contractor',
                  desc: 'HVAC, electrical, maintenance, or inspection service',
                  icon: Wrench,
                  tag: 'OPS ON-CALL'
                },
                {
                  code: '04',
                  key: 'PICKUP',
                  title: 'Outgoing Item Pickup',
                  desc: 'Messenger pickup or scheduled collection',
                  icon: Handbag,
                  tag: 'EXPEDITE'
                }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleIntentSelect(item.key)}
                    className="w-full text-left bg-porcelain hover:bg-parchment active:bg-porcelain border-2 border-alloy p-4 rounded-[4px] transition-all shadow-bevel active:translate-y-[1px] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[3px] bg-carbon text-parchment flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-bevel-dark group-hover:bg-field-teal transition-colors">
                          <IconComponent size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate font-bold">[{item.code}]</span>
                            <span className="font-bold text-sm text-carbon tracking-tight">{item.title}</span>
                          </div>
                          <div className="text-xs text-slate mt-0.5 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <span className="hidden sm:inline-block font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] bg-parchment border border-alloy text-slate uppercase shrink-0 ml-2">
                        {item.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Host Selection Plate */}
        {step === 'MEETING_HOST' && (
          <form onSubmit={handleMeetingSubmit} className="space-y-5 bg-porcelain border-2 border-alloy p-5 rounded-[4px] shadow-sm corner-ticks">
            <div className="flex items-center justify-between border-b border-alloy pb-3">
              <button
                type="button"
                onClick={() => setStep('INTENT')}
                className="inline-flex items-center gap-1 font-mono text-xs text-slate hover:text-carbon font-semibold"
              >
                <ArrowLeft size={13} weight="bold" />
                <span>BACK</span>
              </button>
              <span className="font-mono text-[10px] text-slate uppercase tracking-wider">
                STEP 02 // HOST SELECTION
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-carbon">
                Who are you visiting today?
              </h2>
              <p className="text-xs text-slate mt-0.5">
                We'll notify your host on their console with your arrival time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] font-bold text-slate uppercase tracking-wider mb-1">
                  YOUR FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full bg-parchment border-2 border-alloy rounded-[3px] p-2.5 text-sm text-carbon font-sans focus:outline-none focus:border-field-teal transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-slate uppercase tracking-wider mb-1">
                  SELECT HOST OR DEPARTMENT
                </label>
                <select
                  value={hostSelected}
                  onChange={(e) => setHostSelected(e.target.value)}
                  className="w-full bg-parchment border-2 border-alloy rounded-[3px] p-2.5 text-sm text-carbon font-sans focus:outline-none focus:border-field-teal transition-colors"
                >
                  <option value="Maya Patel">Maya Patel (Recruiting / Talent Lead)</option>
                  <option value="Oliver Vance">Oliver Vance (Design Partner / Studio Director)</option>
                  <option value="Sarah Chen">Sarah Chen (Operations & Logistics)</option>
                  <option value="General Studio">General Studio / Unscheduled</option>
                </select>
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider shadow-bevel-dark">
                DISPATCH ARRIVAL NOTICE
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Tactile Physical Receipt Confirmation */}
        {step === 'CONFIRMED' && (
          <div className="space-y-5">
            {/* Machined Confirmation Docket */}
            <div className="bg-porcelain border-2 border-alloy rounded-[4px] p-6 shadow-md relative corner-ticks overflow-hidden">
              {/* Top Perforation Simulation */}
              <div className="flex justify-between -mx-6 -mt-6 mb-4 px-6 py-2 bg-parchment border-b-2 border-dashed border-alloy text-center">
                <span className="font-mono text-[10px] font-bold tracking-widest text-slate uppercase mx-auto">
                  --- ARRIVAL DOCKET #DS-{Math.floor(1000 + Math.random() * 9000)} ---
                </span>
              </div>

              <div className="text-center space-y-3 pt-2">
                <div className="w-12 h-12 rounded-[3px] bg-carbon text-parchment flex items-center justify-center mx-auto shadow-bevel-dark">
                  <SealCheck size={28} className="text-field-teal" weight="fill" />
                </div>

                <div>
                  <div className="font-mono text-[10px] font-bold text-field-teal tracking-widest uppercase">
                    DISPATCH TRANSMITTED
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-carbon mt-1">
                    {selectedIntent === 'MEETING' ? `${hostSelected} Notified` : 'Arrival Registered'}
                  </h2>
                  <p className="text-xs text-slate mt-1 max-w-xs mx-auto leading-relaxed">
                    {selectedIntent === 'MEETING' 
                      ? 'Your host has received your arrival ping on their console. Please take a seat in the ground-floor gallery vestibule.' 
                      : 'Operations has been alerted. Please place parcels on the designated intake table.'}
                  </p>
                </div>
              </div>

              {/* Receipt Data Table */}
              <div className="mt-6 border-t-2 border-alloy pt-4 font-mono text-xs space-y-2">
                <div className="flex justify-between text-slate">
                  <span>LOCATION:</span>
                  <span className="font-bold text-carbon">32 MERCER ST // ENTRANCE 01</span>
                </div>
                <div className="flex justify-between text-slate">
                  <span>TIMESTAMP:</span>
                  <span className="font-bold text-carbon">{checkinTime} EST</span>
                </div>
                {visitorName && (
                  <div className="flex justify-between text-slate">
                    <span>VISITOR:</span>
                    <span className="font-bold text-carbon">{visitorName}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate">
                  <span>STATUS:</span>
                  <span className="font-bold text-field-teal flex items-center gap-1">
                    <HardwareLed state="active" size="sm" />
                    QUEUED FOR GREETING
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dashed border-alloy text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('INTENT');
                    setVisitorName('');
                    setSelectedIntent('');
                  }}
                  className="font-mono text-xs font-bold text-slate hover:text-carbon underline tracking-wider"
                >
                  [ ↺ REGISTER ANOTHER ARRIVAL ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zero-Biometrics Architectural Footer */}
      <footer className="border-t-2 border-alloy pt-4 mt-8 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-field-teal font-mono text-[10px] font-bold">
          <ShieldCheck size={14} weight="fill" />
          <span>ZERO-BIOMETRIC DIRECTORY PROTOCOL</span>
        </div>
        <p className="font-mono text-[10px] text-slate">
          No facial embeddings · No persistent tracker cookies · Ephemeral session
        </p>
      </footer>
    </div>
  );
}

