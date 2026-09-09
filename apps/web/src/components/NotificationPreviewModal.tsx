'use client';

import React, { useState } from 'react';
import { Badge, Button } from '@doorsignal/ui';
import { X, Envelope, ChatCircleText, CheckCircle, Clock } from '@phosphor-icons/react';

export interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
  intent?: string;
  recipientName?: string;
  recipientEmail?: string;
  title?: string;
  matchReason?: string;
  onAction?: (action: string) => void;
}

export const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({
  isOpen,
  onClose,
  caseNumber = 'DS-1042',
  intent = 'GUEST',
  recipientName = 'Maya Patel',
  recipientEmail = 'maya@northlinestudio.com',
  title = 'Candidate interview with Maya Patel (10:30 – 11:15)',
  matchReason = 'Arrived 3 min early · correct site · visitor checked in',
  onAction
}) => {
  const [tab, setTab] = useState<'SES_EMAIL' | 'SLACK'>('SES_EMAIL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fadeIn">
      <div className="w-full max-w-2xl bg-porcelain border-2 border-carbon rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-parchment border-b-2 border-alloy flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] font-bold text-slate tracking-wider uppercase flex items-center gap-2">
              <span>DISPATCH TELEMETRY</span>
              <span>//</span>
              <span>DOOR CARD NOTIFICATION RECORD</span>
            </div>
            <h3 className="font-bold text-base text-carbon tracking-tight mt-0.5">
              Dispatched Host Card · {caseNumber}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono text-xs border border-alloy rounded bg-porcelain p-0.5">
              <button
                onClick={() => setTab('SES_EMAIL')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                  tab === 'SES_EMAIL' ? 'bg-carbon text-parchment font-bold' : 'text-slate hover:text-carbon'
                }`}
              >
                <Envelope size={13} />
                <span>SES Email</span>
              </button>
              <button
                onClick={() => setTab('SLACK')}
                className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                  tab === 'SLACK' ? 'bg-carbon text-parchment font-bold' : 'text-slate hover:text-carbon'
                }`}
              >
                <ChatCircleText size={13} />
                <span>Slack Block Kit</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-7 h-7 rounded border border-alloy flex items-center justify-center text-slate hover:text-carbon hover:border-carbon transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tab 1: SES Email View */}
        {tab === 'SES_EMAIL' && (
          <div className="p-6 overflow-y-auto space-y-4 font-sans flex-1">
            <div className="border border-alloy rounded bg-[#F5F2EB] p-3 text-xs font-mono space-y-1">
              <div className="text-slate">FROM: <span className="text-carbon font-semibold">DoorSignal Operational Dispatch &lt;dispatch@doorsignal.app&gt;</span></div>
              <div className="text-slate">TO: <span className="text-carbon font-semibold">{recipientName} &lt;{recipientEmail}&gt;</span></div>
              <div className="text-slate">SUBJECT: <span className="text-carbon font-bold">Front Entry · Likely your 10:30 interview (Alex Rivera)</span></div>
              <div className="text-slate">DISPATCH ID: <span className="text-[#12756A] font-semibold">ses_msg_9842109_us_east_1</span></div>
            </div>

            {/* Email Body Card */}
            <div className="border-2 border-carbon rounded p-5 bg-porcelain space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="flex items-center justify-between border-b border-alloy pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-carbon text-parchment flex items-center justify-center font-mono font-bold text-[10px]">
                    │•│
                  </div>
                  <span className="font-bold text-xs text-carbon">DoorSignal Physical Inbox</span>
                </div>
                <Badge variant="teal" size="sm" withDot>
                  FRONT ENTRY
                </Badge>
              </div>

              <div>
                <div className="font-mono text-[10px] font-bold text-[#12756A] uppercase tracking-wider">
                  LIKELY EXPECTED ARRIVAL
                </div>
                <h4 className="text-base font-bold text-carbon mt-0.5">
                  {title}
                </h4>
                <p className="text-xs text-slate font-mono mt-1">
                  {matchReason}
                </p>
              </div>

              <div className="bg-[#F5F2EB] p-3 rounded text-xs space-y-1.5 border border-alloy">
                <div className="flex items-center gap-2 text-carbon">
                  <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                  <span>Arrived 3 minutes early at Northline Studio Front Entry</span>
                </div>
                <div className="flex items-center gap-2 text-carbon">
                  <CheckCircle size={14} className="text-[#12756A]" weight="fill" />
                  <span>Visitor verified voluntary check-in token TOK-ALEX-1030</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 font-mono">
                <button 
                  onClick={() => {
                    onAction?.('ON_MY_WAY');
                    onClose();
                  }}
                  className="w-full py-2.5 bg-[#12756A] text-[#FDFAF5] rounded font-bold text-xs hover:bg-[#0E5B52] transition-colors shadow-sm"
                >
                  [ I'M ON MY WAY ]
                </button>
                <button 
                  onClick={() => {
                    onAction?.('NOT_A_MATCH');
                    onClose();
                  }}
                  className="w-full py-2 bg-[#F5F2EB] text-slate hover:text-carbon rounded text-xs transition-colors border border-alloy"
                >
                  Not a match · Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Slack View */}
        {tab === 'SLACK' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="border border-alloy rounded bg-[#F5F2EB] p-3 text-xs font-mono">
              <span className="text-slate">CHANNEL:</span> <span className="text-carbon font-semibold">#front-door-operations</span> · <span className="text-[#12756A] font-bold">200 OK VIA WEBHOOK</span>
            </div>

            <div className="bg-[#F8F8F8] border-l-4 border-[#12756A] p-4 rounded shadow-sm space-y-3 font-sans">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-carbon text-parchment flex items-center justify-center font-mono text-[9px] font-bold">│•│</div>
                <span className="font-bold text-xs text-carbon">DoorSignal BOT</span>
                <span className="text-[10px] text-slate font-mono">10:27 AM</span>
              </div>

              <div className="text-sm font-bold text-carbon">
                🔔 Likely expected arrival: {title}
              </div>

              <div className="text-xs text-slate space-y-1">
                <div>• <strong className="text-carbon">Threshold:</strong> Front Entry (Ring Video Doorbell Pro 2)</div>
                <div>• <strong className="text-carbon">Reason:</strong> {matchReason}</div>
                <div>• <strong className="text-carbon">Assigned Host:</strong> @{recipientName}</div>
              </div>

              <div className="flex items-center gap-2 pt-2 font-mono">
                <button 
                  onClick={() => {
                    onAction?.('ON_MY_WAY');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-[#12756A] text-[#FDFAF5] rounded text-xs font-bold"
                >
                  On My Way
                </button>
                <button 
                  onClick={() => {
                    onAction?.('NOT_A_MATCH');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-carbon rounded text-xs"
                >
                  Not a Match
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-alloy bg-parchment flex items-center justify-between text-xs font-mono">
          <span className="text-slate">AUTOMATED MULTI-CHANNEL DISPATCH</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
