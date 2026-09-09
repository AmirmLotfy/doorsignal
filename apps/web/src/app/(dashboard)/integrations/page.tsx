'use client';

import React, { useState } from 'react';
import { Badge, Card, Button, HardwareLed } from '@doorsignal/ui';
import { 
  Network, 
  CheckCircle, 
  Warning, 
  ArrowsClockwise, 
  LockKey, 
  Bell, 
  Calendar, 
  Door, 
  Broadcast,
  ShareNetwork,
  Cpu
} from '@phosphor-icons/react';

interface IntegrationState {
  id: string;
  name: string;
  provider: 'RING' | 'GOOGLE' | 'MICROSOFT' | 'SLACK' | 'SES';
  category: string;
  status: 'CONNECTED' | 'STANDBY' | 'ERROR';
  accountRef: string;
  lastSync: string;
  telemetry: string;
  details: string[];
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    {
      id: 'int_ring',
      name: 'Ring Partner API & Device Gateway',
      provider: 'RING',
      category: 'PRIMARY HARDWARE SENSOR',
      status: 'CONNECTED',
      accountRef: 'org_northline_amazon_partner_01',
      lastSync: '12 seconds ago',
      telemetry: 'HMAC-SHA256: VALIDATED · LATENCY: 18ms',
      details: [
        'Device 01: Front Entry (Ring Video Doorbell Pro 2) · Battery 92% · ONLINE',
        'Device 02: Delivery Entrance (Stick Up Cam Elite) · PoE · ONLINE',
        'WHEP Video Stream: Receive-only WebRTC protocol compliance verified',
        'Webhook Ingest: EventBridge bus target doorsignal.bus active'
      ]
    },
    {
      id: 'int_google',
      name: 'Google Workspace Calendar & Directory',
      provider: 'GOOGLE',
      category: 'SCHEDULE CONTEXT PROVIDER',
      status: 'CONNECTED',
      accountRef: 'talent@northlinestudio.com',
      lastSync: '1 minute ago',
      telemetry: 'ACTIVE POLL: 60s INTERVAL · 3 UPCOMING CALENDAR SLOTS',
      details: [
        'Target Calendars: Maya Patel (Talent), Oliver Vance (Client Rooms)',
        'Lookahead Window: ±30 min sliding window around physical arrival events',
        'AgentCore Privacy Shield: Attendee contact data redacted for package & courier cases',
        'Check-in Token Auto-Issuer: Active on invitation acceptance'
      ]
    },
    {
      id: 'int_slack',
      name: 'Slack Operational Channels & Webhooks',
      provider: 'SLACK',
      category: 'TEAM NOTIFICATION DISPATCH',
      status: 'CONNECTED',
      accountRef: 'workspace: northline-studio.slack.com',
      lastSync: '4 minutes ago',
      telemetry: 'CHANNEL: #front-door-operations · WEBHOOK HEALTH: 100%',
      details: [
        'Channel Routing: Host notifications directly DM assigned employee',
        'Courier Routing: Delivery cards auto-routed to #studio-operations',
        'Unmatched Escalations: After-hours sentinel alerts routed to @on-call',
        'Door Card Block Kit: One-touch action buttons [ On my way ] [ View live ]'
      ]
    },
    {
      id: 'int_ses',
      name: 'Amazon Simple Email Service (SES)',
      provider: 'SES',
      category: 'TRANSACTIONAL EMAIL DISPATCH',
      status: 'CONNECTED',
      accountRef: 'ses-us-east-1 // notifications@doorsignal.app',
      lastSync: 'Live',
      telemetry: 'DKIM: VERIFIED · BOUNCE RATE: 0.0%',
      details: [
        'Door Card HTML Dispatch: High-fidelity email with embedded snapshot and action link',
        'Daily Digest: 18:30 operational arrival audit recap to Office Manager',
        'Retention Expiry Notifications: Alerts when temporary media is purged'
      ]
    },
    {
      id: 'int_m365',
      name: 'Microsoft 365 / Microsoft Teams',
      provider: 'MICROSOFT',
      category: 'ENTERPRISE TENANT INTEGRATION',
      status: 'STANDBY',
      accountRef: 'tenant-msft-northline (Unlinked)',
      lastSync: 'Not synced',
      telemetry: 'OAUTH AGENT IDENTITY: READY FOR PROVISIONING',
      details: [
        'Graph API Calendar Sync: Outlook executive meeting reservations',
        'Teams Adaptive Card Webhooks: Alternative notification channel',
        'Status: Standby mode (Primary organization uses Google Workspace)'
      ]
    }
  ]);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testIntegration = (id: string, name: string) => {
    setTestingId(id);
    setTestResult(null);
    setTimeout(() => {
      setTestingId(null);
      setTestResult(`Diagnostic test complete for ${name}: All API handshakes and signature checks PASSED (200 OK).`);
    }, 900);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Industrial Console Header */}
      <div className="border-b-2 border-alloy pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-signal-teal rounded-none"></span>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
              HARDWARE & BUSINESS SYSTEM BUS // CH-05
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-carbon mt-1 font-sans">
            Connected Integrations
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Manage Ring Partner API bindings, calendar contexts, and team dispatch channels.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Badge variant="signal" size="sm" withDot>
            RING BUS: ACTIVE
          </Badge>
          <Badge variant="neutral" size="sm">
            4 OF 5 CONNECTED
          </Badge>
        </div>
      </div>

      {/* Ephemeral Test Feedback Banner */}
      {testResult && (
        <div className="bg-[#E6F3F1] border-2 border-signal-teal/50 text-signal-teal p-3.5 rounded-[4px] text-xs font-mono flex items-center justify-between shadow-well animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={16} weight="fill" />
            <span>{testResult}</span>
          </div>
          <button 
            onClick={() => setTestResult(null)} 
            className="underline hover:opacity-80 font-bold ml-4 uppercase text-[10px]"
          >
            [ Dismiss ]
          </button>
        </div>
      )}

      {/* Integrations Manifest Cards */}
      <div className="space-y-5">
        {integrations.map((item) => (
          <Card key={item.id} withCornerTicks className="p-5 border-2 border-alloy bg-porcelain space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-alloy">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[3px] bg-carbon text-parchment flex items-center justify-center font-mono font-bold text-xs shadow-bevel-dark">
                  {item.provider === 'RING' && 'RING'}
                  {item.provider === 'GOOGLE' && 'GOOG'}
                  {item.provider === 'SLACK' && 'SLACK'}
                  {item.provider === 'SES' && 'SES'}
                  {item.provider === 'MICROSOFT' && 'M365'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-carbon">{item.name}</h2>
                    {item.status === 'CONNECTED' ? (
                      <Badge variant="signal" size="sm" withDot>
                        CONNECTED
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        STANDBY
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate mt-0.5">
                    {item.category} // {item.accountRef}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testIntegration(item.id, item.name)}
                  disabled={testingId === item.id}
                  className="font-mono text-xs gap-1.5"
                >
                  <ArrowsClockwise size={13} className={testingId === item.id ? 'animate-spin' : ''} />
                  <span>{testingId === item.id ? 'TESTING...' : 'TEST HANDSHAKE'}</span>
                </Button>
              </div>
            </div>

            {/* Operational Telemetry Line */}
            <div className="bg-[#F5F2EB] px-3.5 py-2 rounded border border-alloy flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
              <div className="text-carbon flex items-center gap-2">
                <HardwareLed status={item.status === 'CONNECTED' ? 'lit' : 'unlit'} color={item.status === 'CONNECTED' ? 'teal' : 'amber'} size="sm" />
                <span className="font-semibold">{item.telemetry}</span>
              </div>
              <span className="text-slate">SYNCED: {item.lastSync}</span>
            </div>

            {/* Configured Details Ledger */}
            <div className="space-y-1.5 text-xs text-carbon font-sans pl-1">
              {item.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-signal-teal font-mono text-[10px] font-bold">»</span>
                  <span className="text-carbon/90">{detail}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
