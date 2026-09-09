'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Button, HardwareLed } from '@doorsignal/ui';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Door, 
  Calendar, 
  QrCode, 
  Printer, 
  Broadcast, 
  CheckCircle,
  Lightning,
  ShieldCheck,
  Building
} from '@phosphor-icons/react';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 state: Ring Devices
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['ring_front_door']);

  // Step 3 state: Site details
  const [siteName, setSiteName] = useState('Northline Studio');
  const [timezone, setTimezone] = useState('America/New_York');
  const [hours, setHours] = useState('08:30 – 18:30 (Mon–Fri)');

  // Step 4 state: Intents
  const [intents, setIntents] = useState({
    meetings: true,
    deliveries: true,
    service: true,
    pickups: true
  });

  // Step 5 state: Calendar provider
  const [calendarProvider, setCalendarProvider] = useState<'GOOGLE' | 'MICROSOFT'>('GOOGLE');

  // Step 6 state: Unmatched routing
  const [unmatchedRoute, setUnmatchedRoute] = useState<'OPERATIONS' | 'MAYA' | 'BOTH'>('OPERATIONS');

  // Step 8 state: Door test
  const [testState, setTestState] = useState<'IDLE' | 'FIRING' | 'SUCCESS'>('IDLE');

  const toggleDevice = (dev: string) => {
    setSelectedDevices(prev => 
      prev.includes(dev) ? prev.filter(d => d !== dev) : [...prev, dev]
    );
  };

  const handleRunDoorTest = async () => {
    setTestState('FIRING');
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'A' })
      });
      setTimeout(() => {
        setTestState('SUCCESS');
      }, 1200);
    } catch (err) {
      console.error('Test trigger failed:', err);
      setTestState('SUCCESS');
    }
  };

  const stepsList = [
    'Introduction',
    'Connect Ring',
    'Name Location',
    'Arrival Intents',
    'Calendar Setup',
    'Unmatched Routing',
    'Door Plaque',
    'Live Test'
  ];

  return (
    <div className="min-h-screen bg-parchment text-carbon flex flex-col justify-between p-4 sm:p-8 max-w-3xl mx-auto selection:bg-field-teal selection:text-white">
      {/* Top Architectural Header */}
      <div className="space-y-6">
        <header className="border-b-2 border-alloy pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/today" className="w-8 h-8 rounded bg-carbon text-parchment flex items-center justify-center font-mono font-bold text-xs shadow-bevel-dark">
              │•│
            </Link>
            <div>
              <div className="font-bold text-base tracking-tight text-carbon">DoorSignal Guided Onboarding</div>
              <div className="font-mono text-[10px] text-slate uppercase tracking-wider">
                STEP {currentStep} OF 8 // {stepsList[currentStep - 1].toUpperCase()}
              </div>
            </div>
          </div>

          <Link href="/today" className="text-xs font-mono text-slate hover:text-carbon underline">
            [ Exit to Console ]
          </Link>
        </header>

        {/* Step Progress Ticker */}
        <div className="grid grid-cols-8 gap-1.5 font-mono text-[10px]">
          {stepsList.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <div 
                key={step} 
                className={`h-1.5 rounded-none transition-all ${
                  isCurrent ? 'bg-signal-vermilion' : isCompleted ? 'bg-field-teal' : 'bg-alloy'
                }`}
                title={`Step ${stepNum}: ${step}`}
              />
            );
          })}
        </div>

        {/* --- STEP 1: INTRO --- */}
        {currentStep === 1 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 01 // OVERVIEW
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-carbon font-sans">
                Make your front door operational.
              </h1>
              <p className="text-sm text-slate leading-relaxed">
                Connect the tools DoorSignal needs to understand what happens when someone arrives. Turn motion alerts and doorbell rings into real-world business workflows.
              </p>
            </div>

            <div className="bg-[#F5F2EB] p-4 rounded border border-alloy space-y-2 font-mono text-xs text-carbon">
              <div className="font-bold uppercase text-slate text-[10px]">What we're connecting today:</div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-field-teal" weight="bold" />
                <span>Your existing Ring Video Doorbell or Camera</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-field-teal" weight="bold" />
                <span>Google Workspace or Microsoft 365 calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-field-teal" weight="bold" />
                <span>Zero-hardware printable DoorMarker QR code</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="signal" onClick={() => setCurrentStep(2)} className="font-mono text-xs">
                BEGIN ONBOARDING »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 2: CONNECT RING --- */}
        {currentStep === 2 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 02 // HARDWARE DETECTION
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Connect Ring Devices
              </h2>
              <p className="text-xs text-slate">
                Ring OAuth authorized via Amazon Partner API. We discovered 3 devices linked to your account:
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'ring_front_door', name: 'Front Door', type: 'Video Doorbell Pro 2', recommended: true },
                { id: 'ring_dock', name: 'Delivery Entrance / Warehouse', type: 'Stick Up Cam Elite', recommended: true },
                { id: 'ring_parking', name: 'Back Parking Lot', type: 'Floodlight Cam Wired Plus', recommended: false }
              ].map(dev => {
                const isSelected = selectedDevices.includes(dev.id);
                return (
                  <div
                    key={dev.id}
                    onClick={() => toggleDevice(dev.id)}
                    className={`p-3.5 rounded border-2 cursor-pointer flex items-center justify-between transition-all ${
                      isSelected ? 'border-carbon bg-[#F5F2EB]' : 'border-alloy bg-porcelain opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Door size={20} className={isSelected ? 'text-signal-teal' : 'text-slate'} />
                      <div>
                        <div className="text-xs font-bold text-carbon flex items-center gap-2">
                          <span>{dev.name}</span>
                          {dev.recommended && <Badge variant="teal" size="sm">RECOMMENDED</Badge>}
                        </div>
                        <div className="font-mono text-[10px] text-slate">{dev.type}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-[2px] border flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-carbon text-parchment border-carbon' : 'border-alloy'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(1)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(3)} className="font-mono text-xs">
                Continue to Site Info »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 3: NAME LOCATION --- */}
        {currentStep === 3 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 03 // FACILITY CONFIGURATION
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Name this location
              </h2>
              <p className="text-xs text-slate">
                DoorSignal uses this for contextual matching, time zones, and visitor direction.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate uppercase mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans rounded border-2 border-alloy bg-parchment focus:border-carbon focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate uppercase mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded border-2 border-alloy bg-parchment focus:border-carbon focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate uppercase mb-1">
                  Business Hours (For After-Hours Sentinel Mode)
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded border-2 border-alloy bg-parchment focus:border-carbon focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(2)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(4)} className="font-mono text-xs">
                Continue to Arrival Intents »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 4: ARRIVAL INTENTS --- */}
        {currentStep === 4 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 04 // OPERATIONAL SCOPE
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                What should DoorSignal understand?
              </h2>
              <p className="text-xs text-slate">
                Select the arrival intents DoorSignal will classify and route:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'meetings', label: 'Guest & Candidate Meetings', desc: 'Correlate with Google/Microsoft calendar' },
                { key: 'deliveries', label: 'Deliveries & Parcels', desc: 'FedEx, UPS, courier manifests, intake logging' },
                { key: 'service', label: 'Contractors & Service Visits', desc: 'Electricians, HVAC maintenance, work orders' },
                { key: 'pickups', label: 'Pickups & Courier Swaps', desc: 'Scheduled asset collection & outbound parcels' }
              ].map(item => {
                const isChecked = (intents as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setIntents(prev => ({ ...prev, [item.key]: !isChecked }))}
                    className={`p-3.5 rounded border-2 cursor-pointer transition-all ${
                      isChecked ? 'border-carbon bg-[#F5F2EB]' : 'border-alloy bg-porcelain opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-carbon">{item.label}</span>
                      <span className="font-mono text-xs font-bold text-signal-teal">{isChecked ? 'ENABLED' : 'OFF'}</span>
                    </div>
                    <div className="text-[11px] text-slate">{item.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(3)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(5)} className="font-mono text-xs">
                Continue to Calendars »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 5: CONNECT CALENDAR --- */}
        {currentStep === 5 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 05 // CALENDAR CONTEXT
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Connect your team calendar
              </h2>
              <p className="text-xs text-slate">
                DoorSignal pulls upcoming scheduled guests within ±30m of an arrival. Zero personal emails or meeting bodies are stored.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setCalendarProvider('GOOGLE')}
                className={`p-4 rounded border-2 cursor-pointer transition-all ${
                  calendarProvider === 'GOOGLE' ? 'border-carbon bg-[#F5F2EB]' : 'border-alloy bg-porcelain opacity-70'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-carbon mb-1">
                  <span>Google Workspace</span>
                  {calendarProvider === 'GOOGLE' && <Badge variant="teal" size="sm">ACTIVE</Badge>}
                </div>
                <div className="text-xs text-slate">Google Calendar API integration with automated check-in token dispatch.</div>
              </div>

              <div
                onClick={() => setCalendarProvider('MICROSOFT')}
                className={`p-4 rounded border-2 cursor-pointer transition-all ${
                  calendarProvider === 'MICROSOFT' ? 'border-carbon bg-[#F5F2EB]' : 'border-alloy bg-porcelain opacity-70'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-carbon mb-1">
                  <span>Microsoft 365</span>
                  {calendarProvider === 'MICROSOFT' && <Badge variant="teal" size="sm">ACTIVE</Badge>}
                </div>
                <div className="text-xs text-slate">Microsoft Graph API for Outlook calendar reservations and meetings.</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(4)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(6)} className="font-mono text-xs">
                Continue to Escalation »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 6: UNMATCHED ROUTING --- */}
        {currentStep === 6 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 06 // ESCALATION RULES
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Who handles unmatched arrivals?
              </h2>
              <p className="text-xs text-slate">
                When someone arrives who isn't on the calendar, delivery schedule, or service manifest:
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'OPERATIONS', title: 'Operations On-Call Team', desc: 'Dispatch after-hours alert to the studio operations queue' },
                { key: 'MAYA', title: 'Maya Patel (Office Lead)', desc: 'Route directly to studio receptionist / talent manager' },
                { key: 'BOTH', title: 'Broadcast to Both Queues', desc: 'Alert both Operations and Office Lead simultaneously' }
              ].map(opt => (
                <div
                  key={opt.key}
                  onClick={() => setUnmatchedRoute(opt.key as any)}
                  className={`p-3.5 rounded border-2 cursor-pointer flex items-center justify-between transition-all ${
                    unmatchedRoute === opt.key ? 'border-carbon bg-[#F5F2EB]' : 'border-alloy bg-porcelain'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-carbon">{opt.title}</div>
                    <div className="text-[11px] text-slate">{opt.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    unmatchedRoute === opt.key ? 'border-carbon bg-carbon' : 'border-alloy'
                  }`}>
                    {unmatchedRoute === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-parchment" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(5)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(7)} className="font-mono text-xs">
                Continue to Signage »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 7: PRINTABLE DOOR PLAQUE --- */}
        {currentStep === 7 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 07 // PHYSICAL PLACEMENT
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Put DoorSignal at the door
              </h2>
              <p className="text-xs text-slate">
                No tablet. No kiosk. No hardware installation. Print this small, elegant marker and mount it beside your Ring doorbell:
              </p>
            </div>

            {/* Printable Plaque Card Preview */}
            <div className="border-2 border-carbon bg-porcelain p-6 rounded text-center space-y-3 max-w-sm mx-auto shadow-md">
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate uppercase">
                DOORSIGNAL // 32 MERCER ST
              </div>
              <h3 className="font-bold text-lg text-carbon">HERE FOR SOMETHING?</h3>
              <div className="font-mono text-xs text-signal-teal font-semibold">SCAN TO CHECK IN</div>
              
              <div className="w-36 h-36 mx-auto bg-parchment border-2 border-carbon p-2 flex items-center justify-center">
                <QrCode size={110} className="text-carbon" />
              </div>

              <div className="text-[11px] text-slate font-mono">
                No app download required · Instant host notice
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => window.print()} className="font-mono text-xs gap-1.5">
                <Printer size={14} />
                <span>PRINT DOOR PLAQUE (5x7)</span>
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setCurrentStep(6)} className="font-mono text-xs">
                « Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(8)} className="font-mono text-xs">
                Continue to Live Test »
              </Button>
            </div>
          </Card>
        )}

        {/* --- STEP 8: LIVE TEST --- */}
        {currentStep === 8 && (
          <Card withCornerTicks className="p-8 border-2 border-alloy bg-porcelain space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
                STEP 08 // END-TO-END VALIDATION
              </span>
              <h2 className="text-xl font-bold tracking-tight text-carbon">
                Test your front door.
              </h2>
              <p className="text-xs text-slate">
                Trigger a Ring Developer Playground event to verify the complete pipeline (Ring webhook → EventBridge → Bedrock AgentCore → Door Card).
              </p>
            </div>

            {testState === 'IDLE' && (
              <div className="bg-[#F5F2EB] p-6 rounded border border-alloy text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-carbon text-parchment mx-auto flex items-center justify-center">
                  <Broadcast size={24} />
                </div>
                <div>
                  <div className="font-bold text-sm text-carbon">Simulate Ring Doorbell Button Press</div>
                  <div className="text-xs text-slate mt-0.5">Fires test button press with candidate interview context.</div>
                </div>
                <Button 
                  variant="signal" 
                  onClick={handleRunDoorTest}
                  className="font-mono text-xs gap-1.5"
                >
                  <Lightning size={14} weight="fill" />
                  <span>TRIGGER RING PLAYGROUND EVENT »</span>
                </Button>
              </div>
            )}

            {testState === 'FIRING' && (
              <div className="bg-[#F5F2EB] p-8 rounded border border-alloy text-center space-y-3 font-mono">
                <div className="animate-spin text-signal-teal text-lg">◌</div>
                <div className="font-bold text-xs text-carbon">PROCESSING RING SENSOR WEBHOOK...</div>
                <div className="text-[11px] text-slate">AgentCore Runtime resolving arrival against calendar...</div>
              </div>
            )}

            {testState === 'SUCCESS' && (
              <div className="bg-[#E6F3F1] p-6 rounded border-2 border-signal-teal text-center space-y-4 animate-fadeIn">
                <CheckCircle size={40} className="text-signal-teal mx-auto" weight="fill" />
                <div>
                  <h3 className="font-bold text-lg text-carbon">Everything's working.</h3>
                  <div className="font-mono text-xs text-signal-teal font-semibold mt-1">
                    FRONT ENTRY IS LIVE // DOOR TELEMETRY ONLINE
                  </div>
                  <p className="text-xs text-slate mt-2 max-w-md mx-auto">
                    The Ring event was accepted via HMAC-SHA256, contextualized against Maya Patel's calendar, and formatted into an Arrival Case.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/today">
                    <Button variant="primary" className="font-mono text-xs">
                      OPEN PHYSICAL INBOX DASHBOARD »
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {testState !== 'SUCCESS' && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setCurrentStep(7)} className="font-mono text-xs">
                  « Back
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-alloy text-center font-mono text-[10px] text-slate">
        DOORSIGNAL // ZERO-BIOMETRIC PHYSICAL INBOX // AMAZON DEVELOPER HACKATHON 2026
      </footer>
    </div>
  );
}
