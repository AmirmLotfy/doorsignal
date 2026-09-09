'use client';

import React, { useState, useEffect } from 'react';
import { Badge, Card, Button } from '@doorsignal/ui';
import { Package, Truck, Check, Clock } from '@phosphor-icons/react';

interface DeliveryItem {
  id: string;
  carrier: string;
  description: string;
  timeInfo: string;
  status: 'EXPECTED' | 'AWAITING_COLLECTION' | 'COLLECTED';
  door: string;
  recipient: string;
  isDynamic?: boolean;
}

const seedDeliveries: DeliveryItem[] = [
  {
    id: 'd1',
    carrier: 'FedEx',
    description: 'Office supplies & toner cartridges',
    timeInfo: 'Expected today by 5:00 PM',
    status: 'EXPECTED',
    door: 'Delivery Entrance',
    recipient: 'Sarah Chen (Operations)'
  },
  {
    id: 'd2',
    carrier: 'UPS',
    description: 'Sample architectural fabric swatches for Studio A',
    timeInfo: 'Received 11:15 AM',
    status: 'AWAITING_COLLECTION',
    door: 'Front Entry',
    recipient: 'Oliver Vance'
  },
  {
    id: 'd3',
    carrier: 'DHL Express',
    description: 'International precision hardware prototypes',
    timeInfo: 'Collected 09:30 AM by Sarah',
    status: 'COLLECTED',
    door: 'Delivery Entrance',
    recipient: 'Sarah Chen'
  }
];

export default function DeliveriesPage() {
  const [items, setItems] = useState<DeliveryItem[]>(seedDeliveries);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (Array.isArray(data.cases)) {
        const deliveryCases = data.cases.filter((c: any) => c.intent === 'DELIVERY');
        if (deliveryCases.length > 0) {
          setItems(prev => {
            const existingDynamicIds = new Set(prev.filter(p => p.isDynamic).map(p => p.id));
            const newItems = [...prev];

            for (const dc of deliveryCases) {
              if (!existingDynamicIds.has(dc.id)) {
                newItems.unshift({
                  id: dc.id,
                  carrier: dc.candidatesList?.[0]?.displayName?.includes('FedEx') ? 'FedEx' : 'Courier Delivery',
                  description: dc.candidatesList?.[0]?.displayName || 'Inbound parcel threshold delivery',
                  timeInfo: `Arrived ${new Date(dc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                  status: dc.status === 'RESOLVED' ? 'COLLECTED' : 'AWAITING_COLLECTION',
                  door: dc.deviceName || 'Delivery Entrance',
                  recipient: 'Operations Team (Sarah Chen)',
                  isDynamic: true
                });
              } else {
                // Update status if changed
                const idx = newItems.findIndex(p => p.id === dc.id);
                if (idx >= 0 && dc.status === 'RESOLVED' && newItems[idx].status !== 'COLLECTED') {
                  newItems[idx] = { ...newItems[idx], status: 'COLLECTED' };
                }
              }
            }
            return newItems;
          });
        }
      }
    } catch (err) {
      console.error('Failed to poll delivery cases:', err);
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

  const handleMarkCollected = (id: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'COLLECTED',
          timeInfo: `Collected ${nowStr} · Sarah Chen`
        };
      }
      return item;
    }));

    // If dynamic, also notify backend
    const item = items.find(i => i.id === id);
    if (item?.isDynamic) {
      fetch(`/api/cases/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_RECEIVED' })
      }).catch(console.error);
    }
  };

  const expectedList = items.filter(d => d.status === 'EXPECTED');
  const awaitingList = items.filter(d => d.status === 'AWAITING_COLLECTION');
  const collectedList = items.filter(d => d.status === 'COLLECTED');

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between border-b border-[#D2D8D4] pb-4 gap-4">
        <div>
          <div className="font-mono text-[11px] font-semibold text-[#5C6966] tracking-wider uppercase">
            LOGISTICS & PARCEL DISPATCH // CH-03
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121817] mt-1">
            Deliveries
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Badge variant="amber">{items.length} PACKAGES LOGGED</Badge>
        </div>
      </div>

      {/* 3 Focused Industrial Dispatch Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 01: Expected Today */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-[#121817] uppercase border-b border-[#D2D8D4] pb-2">
            <span>01 // Expected Today</span>
            <span className="text-[#5C6966]">{expectedList.length}</span>
          </div>

          {expectedList.map(item => (
            <Card key={item.id} className="p-4 space-y-3 border-l-4 border-l-[#C78B2D] bg-[#FDFAF5]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#121817] font-mono tracking-tight">{item.carrier}</span>
                <Badge variant="amber">IN TRANSIT</Badge>
              </div>
              <div className="text-xs text-[#121817] font-medium leading-snug">{item.description}</div>
              <div className="text-[11px] text-[#5C6966] space-y-0.5 font-mono border-t border-[#D2D8D4] pt-2">
                <div>DOOR: {item.door.toUpperCase()}</div>
                <div>FOR: {item.recipient}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Column 02: Awaiting Collection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-[#121817] uppercase border-b border-[#D2D8D4] pb-2">
            <span>02 // At Threshold</span>
            <span className="text-[#12756A]">{awaitingList.length}</span>
          </div>

          {awaitingList.map(item => (
            <Card key={item.id} className="p-4 space-y-3 border-l-4 border-l-[#12756A] bg-[#FDFAF5]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#121817] font-mono tracking-tight">{item.carrier}</span>
                <Badge variant="teal">AT THRESHOLD</Badge>
              </div>
              <div className="text-xs text-[#121817] font-medium leading-snug">{item.description}</div>
              <div className="text-[11px] text-[#5C6966] space-y-0.5 font-mono border-t border-[#D2D8D4] pt-2">
                <div>{item.timeInfo.toUpperCase()}</div>
                <div>RECIPIENT: {item.recipient}</div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleMarkCollected(item.id)}
                className="w-full text-xs font-mono active:translate-y-[1px]"
              >
                [ MARK AS COLLECTED ]
              </Button>
            </Card>
          ))}
        </div>

        {/* Column 03: Collected / Done */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-[#121817] uppercase border-b border-[#D2D8D4] pb-2">
            <span>03 // Collected Archive</span>
            <span className="text-[#5C6966]">{collectedList.length}</span>
          </div>

          {collectedList.map(item => (
            <Card key={item.id} className="p-4 space-y-2 opacity-75 bg-[#FDFAF5]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#121817] font-mono tracking-tight">{item.carrier}</span>
                <Badge variant="sage">COLLECTED</Badge>
              </div>
              <div className="text-xs text-[#121817]">{item.description}</div>
              <div className="text-[11px] text-[#5C6966] font-mono border-t border-[#D2D8D4] pt-1.5 uppercase">
                {item.timeInfo}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

