'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HardwareLed } from '@doorsignal/ui';
import { 
  Broadcast, 
  ClockCounterClockwise, 
  Package, 
  GitBranch, 
  Network,
  SlidersHorizontal,
  Door,
  Compass
} from '@phosphor-icons/react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Today', code: 'CH-01', href: '/today', icon: Broadcast },
    { label: 'Arrivals', code: 'CH-02', href: '/arrivals', icon: ClockCounterClockwise },
    { label: 'Deliveries', code: 'CH-03', href: '/deliveries', icon: Package },
    { label: 'Workflows', code: 'CH-04', href: '/workflows', icon: GitBranch },
    { label: 'Integrations', code: 'CH-05', href: '/integrations', icon: Network },
    { label: 'Settings', code: 'CH-06', href: '/settings', icon: SlidersHorizontal }
  ];

  return (
    <aside className="w-64 border-r border-[#D2D8D4] bg-[#FDFAF5] flex flex-col justify-between p-4 min-h-screen select-none">
      <div className="space-y-6">
        {/* Brand Header with geometric threshold mark */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-8 h-8 rounded bg-[#121817] text-[#FDFAF5] flex items-center justify-center font-mono font-bold text-xs tracking-tighter shadow-well">
            │•│
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[#121817]">DoorSignal</div>
            <div className="text-[10px] text-[#5C6966] font-mono tracking-wider">NORTHLINE STUDIO // NY</div>
          </div>
        </div>

        {/* Hardware Sensor Monitor Bar */}
        <div className="px-3 py-2.5 bg-[#F5F2EB] rounded border border-[#D2D8D4] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#5C6966]">
            <span>PRIMARY SENSOR</span>
            <span className="text-[#12756A] font-bold">92% BATT</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Door size={14} className="text-[#12756A]" />
              <span className="font-semibold text-xs text-[#121817]">Front Entry</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#12756A]">
              <HardwareLed status="lit" color="teal" size="sm" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Tactile Channel Navigation Links */}
        <nav className="space-y-1 font-mono">
          <div className="px-2 pb-1 text-[10px] font-semibold text-[#5C6966] uppercase tracking-wider">
            Console Channels
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs transition-all active:translate-y-[1px] ${
                  isActive
                    ? 'bg-[#121817] text-[#FDFAF5] shadow-bevel-dark font-semibold'
                    : 'text-[#5C6966] hover:text-[#121817] hover:bg-[#F5F2EB]'
                }`}
              >
                <div className="flex items-center gap-2.5 font-sans">
                  <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                <span className={`text-[10px] ${isActive ? 'text-[#12756A]' : 'text-[#5C6966]/60'}`}>
                  {item.code}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Guided Onboarding Launcher */}
        <div className="pt-2 px-1">
          <Link
            href="/onboarding"
            className={`flex items-center justify-between px-3 py-2 rounded text-xs border border-dashed border-[#D2D8D4] transition-all ${
              pathname.startsWith('/onboarding')
                ? 'bg-[#12756A]/10 text-[#12756A] border-[#12756A]'
                : 'text-[#5C6966] hover:text-[#121817] hover:border-[#121817] bg-[#F5F2EB]'
            }`}
          >
            <div className="flex items-center gap-2 font-sans font-semibold">
              <Compass size={15} className="text-[#12756A]" />
              <span>Guided Onboarding</span>
            </div>
            <span className="text-[10px] font-mono text-[#12756A] font-bold">8-STEP</span>
          </Link>
        </div>
      </div>

      {/* Operator Badge at bottom */}
      <div className="border-t border-[#D2D8D4] pt-4 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#12756A]/10 text-[#12756A] font-mono font-bold text-[11px] flex items-center justify-center border border-[#12756A]/20">
            MP
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-[#121817]">Maya Patel</div>
            <div className="text-[10px] font-mono text-[#5C6966]">OP: HEAD_OF_TALENT</div>
          </div>
        </div>
        <HardwareLed status="lit" color="teal" size="sm" />
      </div>
    </aside>
  );
};
