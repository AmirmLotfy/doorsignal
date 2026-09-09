'use client';

import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  RingWatermarkFrame,
  HardwareLed
} from '@doorsignal/ui';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Package, 
  Wrench, 
  ShieldCheck, 
  Broadcast, 
  CornersOut, 
  Sliders,
  Cpu,
  Envelope
} from '@phosphor-icons/react';
import { AgentTraceDrawer } from '../../../components/AgentTraceDrawer';
import { NotificationPreviewModal } from '../../../components/NotificationPreviewModal';

interface ActiveArrivalCase {
  id: string;
  caseNumber: string;
  deviceName: string;
  intent: 'GUEST' | 'DELIVERY' | 'SERVICE' | 'PICKUP' | 'UNMATCHED';
  status: string;
  matchReason?: string;
  confidenceInternal?: number;
  candidatesList?: Array<{
    displayName: string;
    score: number;
    explanation: string;
  }>;
  createdAt: string;
}

export default function TodayPage() {
  const [activeArrival, setActiveArrival] = useState<ActiveArrivalCase | null>(null);
  const [viewingLive, setViewingLive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      setActiveArrival(data.activeArrival);
    } catch (err) {
      console.error('Failed to poll cases:', err);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 2000);

    const onScenario = () => {
      fetchCases();
    };
    window.addEventListener('doorsignal:scenario-triggered', onScenario);

    return () => {
      clearInterval(interval);
      window.removeEventListener('doorsignal:scenario-triggered', onScenario);
    };
  }, []);

  const handleAction = async (action: string) => {
    if (!activeArrival) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/cases/${activeArrival.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (action === 'NOTIFY_HOST') {
        setStatusNotification('Host Maya Patel notified via direct dispatch and email card.');
      } else if (action === 'ON_MY_WAY') {
        setStatusNotification('Confirmed: Maya Patel marked "On my way". Visitor PWA updated.');
      } else if (action === 'MARK_RECEIVED') {
        setStatusNotification('Package marked received and logged in inventory.');
      } else if (action === 'DISMISS') {
        setStatusNotification('Arrival dismissed.');
      } else if (action === 'NOT_A_MATCH') {
        setStatusNotification('Match rejected. Reclassified as Unmatched Arrival.');
      }
      fetchCases();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Architectural Header */}
      <div className="flex flex-wrap items-baseline justify-between border-b border-[#D2D8D4] pb-4 gap-4">
        <div>
          <div className="font-mono text-[11px] font-semibold text-[#5C6966] tracking-wider uppercase flex items-center gap-2">
            <span>NORTHLINE STUDIO</span>
            <span>//</span>
            <span>32 MERCER ST, NY</span>
            <span>//</span>
            <span>40.7209° N, 74.0007° W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121817] mt-1">
            Physical Arrival Inbox
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <Badge variant="teal" withDot>
            RING SENSOR LINKED
          </Badge>
          <Badge variant="neutral">
            ZERO BIOMETRICS
          </Badge>
        </div>
      </div>

      {/* Operational Feedback Notice */}
      {statusNotification && (
        <div className="bg-[#E6F3F1] border border-[#B8DFDA] text-[#12756A] p-3 rounded text-xs font-mono flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <HardwareLed status="lit" color="teal" size="sm" />
            <span>DISPATCH CONFIRMED: {statusNotification}</span>
          </div>
          <button 
            onClick={() => setStatusNotification(null)}
            className="text-[#12756A] hover:underline uppercase text-[10px] font-bold"
          >
            [ Dismiss ]
          </button>
        </div>
      )}

      {/* Hero Section: Active Telemetry Dossier vs Living Standby Monitor */}
      {activeArrival ? (
        /* Screen 02: Active Arrival Telemetry Dossier */
        <Card className="border-2 border-[#121817] bg-[#FDFAF5] overflow-hidden shadow-sm withCornerTicks">
          {/* Dossier Header Bar */}
          <CardHeader className="bg-[#121817] text-[#FDFAF5] flex items-center justify-between py-2 px-4 border-b border-black">
            <div className="flex items-center gap-3">
              <HardwareLed status="pulsing" color="vermilion" size="md" />
              <div className="font-mono text-xs font-bold tracking-wider text-[#FDFAF5]">
                ARRIVAL DOSSIER // {activeArrival.caseNumber}
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#FDFAF5]/70 flex items-center gap-2">
              <span>LOCATION: {activeArrival.deviceName.toUpperCase()}</span>
              <span>·</span>
              <span>{new Date(activeArrival.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Broadcast Camera Monitor Frame */}
              <div className="lg:col-span-6 space-y-2">
                <RingWatermarkFrame
                  deviceId="ring_dev_front_door_01"
                  deviceName={activeArrival.deviceName}
                  isLive={viewingLive}
                  maxSeconds={60}
                  imageUrl="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-[#5C6966] px-1">
                  <span>RING WHEP LIVE VIEW (RECEIVE-ONLY)</span>
                  <button 
                    onClick={() => setViewingLive(!viewingLive)}
                    className="text-[#12756A] hover:underline font-bold uppercase"
                  >
                    {viewingLive ? '[ Disconnect Stream ]' : '[ Connect Live View ]'}
                  </button>
                </div>
              </div>

              {/* Right Column: Context Matching, Evidence & Controls */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {activeArrival.intent === 'GUEST' && <Badge variant="teal" withDot>LIKELY EXPECTED ARRIVAL</Badge>}
                    {activeArrival.intent === 'DELIVERY' && <Badge variant="amber" withDot>EXPECTED DELIVERY</Badge>}
                    {activeArrival.intent === 'SERVICE' && <Badge variant="amber" withDot>SCHEDULED SERVICE VISIT</Badge>}
                    {activeArrival.intent === 'UNMATCHED' && <Badge variant="vermilion" withDot>UNMATCHED ARRIVAL</Badge>}
                    
                    {activeArrival.confidenceInternal && (
                      <span className="text-[11px] font-mono text-[#5C6966] border border-[#D2D8D4] px-1.5 py-0.5 rounded bg-[#F5F2EB]">
                        SCORE: {Math.round(activeArrival.confidenceInternal * 100)}%
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold tracking-tight text-[#121817]">
                    {activeArrival.intent === 'GUEST' && 'Candidate Interview with Maya Patel (10:30 – 11:15)'}
                    {activeArrival.intent === 'DELIVERY' && 'Office Supplies (FedEx) · Due Today'}
                    {activeArrival.intent === 'SERVICE' && 'AC Maintenance (HVAC Pro) · Scheduled Service'}
                    {activeArrival.intent === 'UNMATCHED' && 'Unmatched Physical Arrival at Front Entry'}
                  </h2>

                  <p className="text-xs text-[#5C6966] font-mono mt-1">
                    {activeArrival.matchReason}
                  </p>
                </div>

                {/* Evidence Ledger Block */}
                <div className="bg-[#F5F2EB] p-3.5 rounded border border-[#D2D8D4] space-y-2">
                  <div className="text-[10px] font-bold text-[#5C6966] uppercase font-mono tracking-wider">
                    Contextual Correlation Evidence
                  </div>
                  <div className="space-y-1.5 text-xs text-[#121817]">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                      <span>Physical threshold verified: Northline Studio Front Entry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                      <span>Sensor signature: Ring Video Doorbell Pro (Hardware ID matched)</span>
                    </div>
                    {activeArrival.intent === 'GUEST' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                        <span>Visitor voluntary check-in received with verified token TOK-ALEX-1030</span>
                      </div>
                    )}
                    {activeArrival.intent === 'DELIVERY' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                        <span>Carrier order match: Restock supplies scheduled today</span>
                      </div>
                    )}
                    {activeArrival.intent === 'UNMATCHED' && (
                      <div className="flex items-center gap-2 text-[#E64A26] font-mono">
                        <Clock size={14} weight="bold" />
                        <span>Zero calendar meetings, courier tracking, or work orders registered</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactile Hardware Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                  {activeArrival.intent === 'GUEST' && (
                    <>
                      <Button
                        variant="signal"
                        onClick={() => handleAction('NOTIFY_HOST')}
                        disabled={isProcessing}
                      >
                        [ NOTIFY MAYA PATEL ]
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction('ON_MY_WAY')}
                        disabled={isProcessing}
                      >
                        [ I'M ON MY WAY ]
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction('NOT_A_MATCH')}
                        disabled={isProcessing}
                      >
                        Reject match
                      </Button>
                    </>
                  )}

                  {activeArrival.intent === 'DELIVERY' && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleAction('MARK_RECEIVED')}
                        disabled={isProcessing}
                      >
                        [ MARK RECEIVED ]
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction('NOTIFY_HOST')}
                        disabled={isProcessing}
                      >
                        [ NOTIFY OPERATIONS ]
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction('NOT_A_MATCH')}
                        disabled={isProcessing}
                      >
                        Reject match
                      </Button>
                    </>
                  )}

                  {activeArrival.intent === 'UNMATCHED' && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction('NOTIFY_HOST')}
                        disabled={isProcessing}
                      >
                        [ NOTIFY ON-CALL ]
                      </Button>
                      <Button
                        variant="console"
                        onClick={() => setViewingLive(true)}
                      >
                        [ VIEW LIVE STREAM ]
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction('DISMISS')}
                        disabled={isProcessing}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>

                {/* Developer & Judge Observability Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#D2D8D4] text-[11px] font-mono">
                  <button
                    onClick={() => setIsTraceOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F2EB] hover:bg-[#EAE5DA] text-carbon border border-[#D2D8D4] transition-all font-semibold"
                  >
                    <Cpu size={13} className="text-[#12756A]" />
                    <span>[ View AgentCore Trace ]</span>
                  </button>

                  <button
                    onClick={() => setIsNotificationOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F2EB] hover:bg-[#EAE5DA] text-carbon border border-[#D2D8D4] transition-all font-semibold"
                  >
                    <Envelope size={13} className="text-[#12756A]" />
                    <span>[ View Dispatched Card ]</span>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Screen 01: Active Telemetry Standby Monitor */
        <Card className="p-5 bg-[#FDFAF5] border border-[#D2D8D4] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-[#D2D8D4] pb-3 gap-2">
            <div className="flex items-center gap-3">
              <HardwareLed status="pulsing" color="teal" size="md" />
              <div>
                <div className="font-mono text-[10px] font-bold text-[#5C6966] uppercase tracking-wider">
                  DOOR TELEMETRY STANDBY // ACTIVE MONITORING
                </div>
                <div className="font-bold text-sm text-[#121817] flex items-center gap-2">
                  <span>Front Entry Threshold</span>
                  <span className="text-[#5C6966] font-mono text-xs font-normal">· Sensor Quiet · Zero active arrivals</span>
                </div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#5C6966] flex items-center gap-3">
              <span>LATENCY: 22ms</span>
              <span>·</span>
              <span>POLL: 2000ms</span>
            </div>
          </div>

          {/* Telemetry Architecture Schematic */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="p-2.5 bg-[#F5F2EB] rounded border border-[#D2D8D4] space-y-0.5">
              <div className="text-[10px] text-[#5C6966] uppercase">Sensor Status</div>
              <div className="font-bold text-[#121817] flex items-center gap-1.5">
                <HardwareLed status="lit" color="teal" size="sm" />
                ONLINE (PRO V2)
              </div>
            </div>
            <div className="p-2.5 bg-[#F5F2EB] rounded border border-[#D2D8D4] space-y-0.5">
              <div className="text-[10px] text-[#5C6966] uppercase">Scheduled Today</div>
              <div className="font-bold text-[#121817]">4 ARRIVAL EVENTS</div>
            </div>
            <div className="p-2.5 bg-[#F5F2EB] rounded border border-[#D2D8D4] space-y-0.5">
              <div className="text-[10px] text-[#5C6966] uppercase">Next Scheduled</div>
              <div className="font-bold text-[#E64A26]">10:30 AM (GUEST)</div>
            </div>
            <div className="p-2.5 bg-[#F5F2EB] rounded border border-[#D2D8D4] space-y-0.5">
              <div className="text-[10px] text-[#5C6966] uppercase">Media Policy</div>
              <div className="font-bold text-[#12756A]">ZERO BIOMETRICS</div>
            </div>
          </div>
        </Card>
      )}

      {/* Expected Next Arrival Tickets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#D2D8D4] pb-2 font-mono">
          <h3 className="text-xs font-bold text-[#121817] uppercase tracking-wider">
            Expected Next Today // Temporal Horizon
          </h3>
          <span className="text-[11px] text-[#5C6966]">4 SCHEDULED EVENTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ticket 1 */}
          <div className="p-4 bg-[#FDFAF5] rounded border border-[#D2D8D4] hover:border-[#12756A] transition-all space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold text-[#12756A]">
                  10:30 AM – 11:15 AM
                </div>
                <div className="font-bold text-sm text-[#121817]">
                  Candidate Interview · Alex Rivera
                </div>
                <div className="text-xs text-[#5C6966]">
                  Host: Maya Patel (Head of Talent)
                </div>
              </div>
              <Badge variant="teal">GUEST</Badge>
            </div>
            <div className="text-[10px] font-mono text-[#5C6966] border-t border-[#D2D8D4] pt-2 flex items-center justify-between">
              <span>TOKEN: TOK-ALEX-1030</span>
              <span>DOOR: FRONT ENTRY</span>
            </div>
          </div>

          {/* Ticket 2 */}
          <div className="p-4 bg-[#FDFAF5] rounded border border-[#D2D8D4] hover:border-[#C78B2D] transition-all space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold text-[#C78B2D]">
                  12:00 PM – 01:00 PM
                </div>
                <div className="font-bold text-sm text-[#121817]">
                  Courier Pickup · Architectural Models
                </div>
                <div className="text-xs text-[#5C6966]">
                  Assigned to: Operations Team (Sarah Chen)
                </div>
              </div>
              <Badge variant="amber">PICKUP</Badge>
            </div>
            <div className="text-[10px] font-mono text-[#5C6966] border-t border-[#D2D8D4] pt-2 flex items-center justify-between">
              <span>CARRIER: QUICK COURIER NYC</span>
              <span>DOOR: FRONT ENTRY</span>
            </div>
          </div>

          {/* Ticket 3 */}
          <div className="p-4 bg-[#FDFAF5] rounded border border-[#D2D8D4] hover:border-[#12756A] transition-all space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold text-[#12756A]">
                  03:30 PM – 04:30 PM
                </div>
                <div className="font-bold text-sm text-[#121817]">
                  Client Meeting · Studio Walkthrough
                </div>
                <div className="text-xs text-[#5C6966]">
                  Host: Oliver Vance (Studio Director)
                </div>
              </div>
              <Badge variant="teal">GUEST</Badge>
            </div>
            <div className="text-[10px] font-mono text-[#5C6966] border-t border-[#D2D8D4] pt-2 flex items-center justify-between">
              <span>SOURCE: GOOGLE CALENDAR</span>
              <span>DOOR: FRONT ENTRY</span>
            </div>
          </div>

          {/* Ticket 4 */}
          <div className="p-4 bg-[#FDFAF5] rounded border border-[#D2D8D4] hover:border-[#C78B2D] transition-all space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold text-[#C78B2D]">
                  07:30 PM – 08:30 PM (AFTER-HOURS)
                </div>
                <div className="font-bold text-sm text-[#121817]">
                  AC Maintenance · HVAC Pro
                </div>
                <div className="text-xs text-[#5C6966]">
                  Assigned to: Operations On-Call
                </div>
              </div>
              <Badge variant="amber">SERVICE</Badge>
            </div>
            <div className="text-[10px] font-mono text-[#5C6966] border-t border-[#D2D8D4] pt-2 flex items-center justify-between">
              <span>WORK ORDER: #WO-891</span>
              <span>DOOR: FRONT ENTRY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Earlier Logbook Rows */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-[#D2D8D4] pb-2 font-mono">
          <h3 className="text-xs font-bold text-[#121817] uppercase tracking-wider">
            Earlier Today // Archival Log
          </h3>
          <span className="text-[11px] text-[#5C6966]">2 RESOLVED CASES</span>
        </div>

        <div className="bg-[#FDFAF5] border border-[#D2D8D4] rounded divide-y divide-[#D2D8D4] font-mono text-xs">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[#5C6966]">09:18:22 AM</span>
              <Badge variant="amber">DELIVERY</Badge>
              <span className="font-semibold text-[#121817] font-sans">Office Supplies (FedEx)</span>
              <span className="text-[11px] text-[#5C6966]">· Received by Sarah Chen</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="sage">RESOLVED</Badge>
              <span className="text-[10px] text-[#5C6966]">DS-1039</span>
            </div>
          </div>

          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[#5C6966]">08:54:10 AM</span>
              <Badge variant="teal">GUEST</Badge>
              <span className="font-semibold text-[#121817] font-sans">Oliver Vance Client Briefing</span>
              <span className="text-[11px] text-[#5C6966]">· Host acknowledged</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="sage">RESOLVED</Badge>
              <span className="text-[10px] text-[#5C6966]">DS-1038</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bedrock AgentCore Trace Drawer */}
      <AgentTraceDrawer
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        caseNumber={activeArrival?.caseNumber || 'DS-1042'}
        intent={activeArrival?.intent || 'GUEST'}
        deviceName={activeArrival?.deviceName || 'Front Entry'}
        matchScore={Math.round((activeArrival?.confidenceInternal || 0.95) * 100)}
      />

      {/* Dispatched Notification (SES & Slack) Modal */}
      <NotificationPreviewModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        caseNumber={activeArrival?.caseNumber || 'DS-1042'}
        intent={activeArrival?.intent || 'GUEST'}
        recipientName={activeArrival?.intent === 'GUEST' ? 'Maya Patel' : 'Sarah Chen'}
        recipientEmail={activeArrival?.intent === 'GUEST' ? 'maya@northlinestudio.com' : 'ops@northlinestudio.com'}
        title={
          activeArrival?.intent === 'GUEST'
            ? 'Candidate interview with Maya Patel (10:30 – 11:15)'
            : activeArrival?.intent === 'DELIVERY'
            ? 'Office Supplies (FedEx) · Due Today'
            : 'Scheduled service visit / Unmatched arrival'
        }
        matchReason={activeArrival?.matchReason || 'Arrived within expected window · site confirmed'}
        onAction={handleAction}
      />
    </div>
  );
}
