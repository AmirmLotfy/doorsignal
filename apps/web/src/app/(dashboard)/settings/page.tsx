'use client';

import React, { useState } from 'react';
import { Badge, Card, Button, HardwareLed } from '@doorsignal/ui';
import { 
  ShieldCheck, 
  Trash, 
  DownloadSimple, 
  QrCode, 
  Check, 
  ArrowsClockwise,
  Warning,
  Sliders,
  Cpu,
  Broadcast,
  Fingerprint,
  Printer
} from '@phosphor-icons/react';
import { PrintableSignModal } from '../../../components/PrintableSignModal';

export default function SettingsPage() {
  const [retention, setRetention] = useState('60');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletedStatus, setDeletedStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const handleDeleteRingData = () => {
    setDeletedStatus('Zero-trace purge executed. All Ring webhook payloads, snapshot buffers, and event telemetry have been permanently eradicated.');
    setDeleteConfirm(false);
  };

  const handlePollHardware = () => {
    setIsPolling(true);
    setTimeout(() => setIsPolling(false), 800);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Industrial Page Header */}
      <div className="border-b-2 border-alloy pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-signal-vermilion rounded-none"></span>
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate uppercase">
              HARDWARE CONTROLLER & COMPLIANCE // 32 MERCER ST
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-carbon mt-1 font-sans">
            Settings & Privacy Center
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Ring Partner API bindings, architectural signage generation, and zero-biometric data governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="signal" size="sm" withDot>
            COMPLIANCE: SOC2 / GDPR / BIPA
          </Badge>
        </div>
      </div>

      {/* Ephemeral Alert Banner */}
      {deletedStatus && (
        <div className="bg-[#FDF0EC] border-2 border-signal-vermilion/50 text-signal-vermilion p-4 rounded-[4px] text-xs font-mono flex items-center justify-between shadow-well animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Warning size={16} weight="bold" />
            <span>{deletedStatus}</span>
          </div>
          <button onClick={() => setDeletedStatus(null)} className="underline hover:opacity-80 font-bold ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* 1. Ring Partner API Integration & Hardware Inventory */}
      <Card withCornerTicks className="p-6 space-y-5 border-2 border-alloy bg-porcelain">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-alloy">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[3px] bg-carbon text-parchment flex items-center justify-center font-bold tracking-tighter font-mono text-sm shadow-bevel-dark">
              ring
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-carbon">Ring Partner API Integration</h2>
                <Badge variant="signal" size="sm" withDot>
                  AUTHENTICATED
                </Badge>
              </div>
              <div className="font-mono text-xs text-slate mt-0.5">
                ORGANIZATION: northline-studio@amazon.com // PARTNER_TENANT_ID: azn_part_0982
              </div>
            </div>
          </div>

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handlePollHardware}
            disabled={isPolling}
            className="gap-1.5 font-mono text-xs shrink-0 self-start sm:self-auto"
          >
            <ArrowsClockwise size={13} className={isPolling ? 'animate-spin' : ''} />
            <span>{isPolling ? 'POLLING...' : 'POLL HARDWARE'}</span>
          </Button>
        </div>

        {/* Authorized Sensor Hardware Manifest */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold text-slate uppercase tracking-wider">
            <span>REGISTERED SENSOR INTERFACES (2 ACTIVE)</span>
            <span>TELEMETRY HEALTH</span>
          </div>

          <div className="divide-y divide-alloy border border-alloy rounded-[3px] overflow-hidden bg-parchment/60">
            {/* Device 1 */}
            <div className="p-3.5 bg-porcelain flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <HardwareLed state="active" size="sm" className="mt-1 sm:mt-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-carbon">Front Main Entrance</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-parchment border border-alloy text-slate">
                      ring_dev_front_door_01
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate mt-0.5">
                    Model: Ring Video Doorbell Pro 2 · FW: v3.18.44-prod · RSSI: -44 dBm
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="font-mono text-[11px] text-field-teal font-semibold">92% BATTERY (TRICKLE)</span>
                <Badge variant="outline" size="sm">PRIMARY</Badge>
              </div>
            </div>

            {/* Device 2 */}
            <div className="p-3.5 bg-porcelain flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <HardwareLed state="active" size="sm" className="mt-1 sm:mt-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-carbon">Freight & Courier Loading Dock</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-parchment border border-alloy text-slate">
                      ring_dev_dock_02
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate mt-0.5">
                    Model: Ring Stick Up Cam Elite · FW: v2.9.11-wired · RSSI: -38 dBm
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="font-mono text-[11px] text-field-teal font-semibold">POE 48V WIRED</span>
                <Badge variant="outline" size="sm">SECONDARY</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Architectural Printable QR Sign Plate */}
      <Card withCornerTicks className="p-6 space-y-5 border-2 border-alloy bg-porcelain">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-alloy">
          <div>
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-field-teal" />
              <h2 className="font-bold text-base text-carbon">Architectural QR Marker Plate</h2>
            </div>
            <p className="text-xs text-slate mt-1">
              Precision vector signage for physical mounting beside Ring hardware. Visitors scan to check in without app download.
            </p>
          </div>

          <a
            href="/visitor/northline"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-alloy bg-porcelain text-xs font-mono font-bold text-carbon hover:bg-parchment shadow-sm active:translate-y-[1px]"
          >
            <QrCode size={15} /> TEST VISITOR PWA ↗
          </a>
        </div>

        {/* Physical Sign Plate Simulation Viewport */}
        <div className="bg-parchment p-5 rounded-[4px] border-2 border-alloy shadow-well flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Visual Sign Mockup */}
          <div className="w-full md:w-auto bg-porcelain border-2 border-carbon p-4 rounded-[3px] shadow-md flex items-center gap-4">
            {/* High-Contrast SVG QR Graphic */}
            <div className="w-20 h-20 bg-carbon p-1.5 rounded-[2px] flex flex-col items-center justify-between shrink-0">
              <div className="w-full flex justify-between">
                <div className="w-4 h-4 border-2 border-white bg-white p-0.5"><div className="w-full h-full bg-carbon"></div></div>
                <div className="w-4 h-4 border-2 border-white bg-white p-0.5"><div className="w-full h-full bg-carbon"></div></div>
              </div>
              <div className="w-full flex justify-center py-1">
                <div className="font-mono text-[7px] text-white tracking-widest font-bold">DOORSIGNAL</div>
              </div>
              <div className="w-full flex justify-between">
                <div className="w-4 h-4 border-2 border-white bg-white p-0.5"><div className="w-full h-full bg-carbon"></div></div>
                <div className="w-2 h-2 bg-white self-center"></div>
              </div>
            </div>

            <div className="space-y-1 font-sans">
              <div className="font-mono text-[9px] font-bold text-signal-vermilion tracking-widest uppercase">
                DOORSIGNAL HARDWARE MARKER
              </div>
              <div className="font-bold text-sm text-carbon leading-none">
                NORTHLINE STUDIO
              </div>
              <div className="text-xs text-slate">
                32 Mercer St · New York, NY
              </div>
              <div className="font-mono text-[10px] text-field-teal pt-1">
                doorsignal.com/northline
              </div>
            </div>
          </div>

          {/* Sign Specifications & Download */}
          <div className="space-y-3 w-full md:w-auto">
            <div className="font-mono text-xs text-slate space-y-1">
              <div><span className="font-bold text-carbon">MATERIAL SPEC:</span> Anodized Aluminum or Matte Acrylic</div>
              <div><span className="font-bold text-carbon">DIMENSIONS:</span> 120mm × 80mm (Beveled Edge)</div>
              <div><span className="font-bold text-carbon">TOKEN HASH:</span> <span className="font-mono text-[11px] text-field-teal">qr_northline_mercer_32</span></div>
            </div>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsSignModalOpen(true)}
              className="gap-2 font-mono text-xs w-full justify-center"
            >
              <Printer size={15} weight="bold" /> PREVIEW & PRINT 5x7 PLAQUE
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Zero-Biometric Architecture & Media Retention Controls */}
      <Card withCornerTicks className="p-6 space-y-5 border-2 border-alloy bg-porcelain">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-field-teal" weight="fill" />
            <h2 className="font-bold text-base text-carbon">Zero-Biometric Architecture & Data Retention</h2>
          </div>
          <p className="text-xs text-slate mt-1 max-w-2xl leading-relaxed">
            DoorSignal operates on strict zero-biometric principles. No facial recognition embeddings, no emotional analysis, and no persistent mass-surveillance recording lakes are permitted.
          </p>
        </div>

        {/* Retention Stepper Switch */}
        <div className="space-y-3">
          <div className="font-mono font-bold text-[10px] text-slate uppercase tracking-wider">
            OPTICAL SNAPSHOT BUFFER RETENTION POLICY
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: '15 MINUTES', val: '15', desc: 'Ephemeral in-memory ring buffer. Auto-purged upon dispatch resolution.' },
              { label: '1 HOUR (DEFAULT)', val: '60', desc: 'Compliant audit window for operational dispute resolution.' },
              { label: 'ZERO RETENTION', val: '0', desc: 'Strict airgap mode. No snapshot frames ever written to storage disk.' }
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setRetention(opt.val)}
                className={`p-3.5 rounded-[4px] border-2 text-left transition-all shadow-sm active:translate-y-[1px] ${
                  retention === opt.val
                    ? 'border-field-teal bg-parchment shadow-well'
                    : 'border-alloy bg-porcelain hover:bg-parchment/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-carbon">{opt.label}</span>
                  <HardwareLed state={retention === opt.val ? 'active' : 'inactive'} size="sm" />
                </div>
                <div className="text-[11px] text-slate mt-1.5 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Destructive Ring Data Purge Protocol */}
        <div className="border-t-2 border-alloy pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-carbon font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint size={16} className="text-slate" />
              <span>PERMANENT ZERO-TRACE PURGE PROTOCOL</span>
            </div>
            <div className="text-xs text-slate mt-0.5">
              Instantly purge all historical Ring webhook payloads, cache entries, and delivery telemetry logs.
            </div>
          </div>

          {deleteConfirm ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleDeleteRingData} className="font-mono text-xs">
                CONFIRM PURGE
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)} className="font-mono text-xs">
                CANCEL
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDeleteConfirm(true)} 
              className="text-signal-vermilion hover:bg-[#FDF0EC] border border-signal-vermilion/30 font-mono text-xs"
            >
              <Trash size={14} className="mr-1.5" /> PURGE ALL RECORDED DATA
            </Button>
          )}
        </div>
      </Card>

      {/* Printable Architectural Marker Modal */}
      <PrintableSignModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        siteName="Northline Studio"
        address="32 Mercer Street · New York, NY"
      />
    </div>
  );
}

