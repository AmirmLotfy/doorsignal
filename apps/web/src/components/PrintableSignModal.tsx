'use client';

import React from 'react';
import { Button } from '@doorsignal/ui';
import { X, Printer, QrCode } from '@phosphor-icons/react';

export interface PrintableSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName?: string;
  address?: string;
}

export const PrintableSignModal: React.FC<PrintableSignModalProps> = ({
  isOpen,
  onClose,
  siteName = 'Northline Studio',
  address = '32 Mercer Street · New York, NY'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fadeIn">
      <div className="w-full max-w-lg bg-porcelain border-2 border-carbon rounded-[4px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-parchment border-b-2 border-alloy flex items-center justify-between no-print">
          <div>
            <div className="font-mono text-[10px] font-bold text-slate tracking-wider uppercase">
              ARCHITECTURAL SIGNAGE // 5x7 PLAQUE
            </div>
            <h3 className="font-bold text-base text-carbon tracking-tight mt-0.5">
              Printable DoorSignal Marker
            </h3>
          </div>

          <button 
            onClick={onClose}
            className="w-7 h-7 rounded border border-alloy flex items-center justify-center text-slate hover:text-carbon hover:border-carbon transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* The Printable Plaque (Target of print) */}
        <div className="p-8 overflow-y-auto flex items-center justify-center bg-[#ECE7DC]">
          <div 
            id="doorsignal-printable-marker"
            className="w-[320px] min-h-[440px] bg-[#FDFAF5] text-carbon border-4 border-[#121817] p-6 flex flex-col justify-between text-center relative shadow-lg"
          >
            {/* Corner Precision Ticks */}
            <div className="absolute top-1 left-1 font-mono text-[8px] text-[#121817] leading-none">+</div>
            <div className="absolute top-1 right-1 font-mono text-[8px] text-[#121817] leading-none">+</div>
            <div className="absolute bottom-1 left-1 font-mono text-[8px] text-[#121817] leading-none">+</div>
            <div className="absolute bottom-1 right-1 font-mono text-[8px] text-[#121817] leading-none">+</div>

            {/* Plaque Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.25em] text-[#5C6966] uppercase">
                <span>DOORSIGNAL</span>
                <span>//</span>
                <span>SYSTEM SENSOR</span>
              </div>
              <h2 className="font-bold text-xl tracking-tight text-[#121817] uppercase mt-2">
                HERE FOR SOMETHING?
              </h2>
              <div className="font-mono text-xs font-bold text-[#12756A] tracking-wider uppercase">
                SCAN TO CHECK IN
              </div>
            </div>

            {/* High Contrast QR Code Frame */}
            <div className="my-4 p-3 bg-white border-2 border-[#121817] inline-block mx-auto">
              <QrCode size={150} className="text-[#121817]" />
            </div>

            {/* Plaque Footer & Location */}
            <div className="space-y-2 border-t border-[#D2D8D4] pt-3">
              <div className="font-bold text-xs tracking-tight text-[#121817]">
                {siteName}
              </div>
              <div className="font-mono text-[10px] text-[#5C6966]">
                {address}
              </div>
              <div className="font-mono text-[9px] text-[#12756A] font-semibold tracking-wide uppercase pt-1">
                Zero app download · Instant host dispatch
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-alloy bg-parchment flex items-center justify-between no-print font-mono text-xs">
          <span className="text-slate">MOUNT NEXT TO RING HARDWARE</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="signal" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer size={14} />
              <span>PRINT SIGN (5x7)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
