'use client';

import React from 'react';
import { Navigation } from '../../components/Navigation';
import { SimulationToolbar } from '../../components/SimulationToolbar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Simulation Harness bar for demo presentation */}
      <SimulationToolbar />

      <div className="flex flex-1">
        <Navigation />
        <main className="flex-1 p-8 max-w-7xl overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
