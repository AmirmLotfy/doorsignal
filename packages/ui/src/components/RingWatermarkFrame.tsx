import React, { useState, useEffect } from 'react';
import { cn } from '../utils';
import { HardwareLed } from './HardwareLed';

export interface RingWatermarkFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  deviceId: string;
  deviceName: string;
  isLive?: boolean;
  maxSeconds?: number;
  imageUrl?: string;
  onSessionTimeout?: () => void;
}

export const RingWatermarkFrame: React.FC<RingWatermarkFrameProps> = ({
  className,
  deviceId,
  deviceName,
  isLive = false,
  maxSeconds = 60,
  imageUrl,
  onSessionTimeout,
  children,
  ...props
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(maxSeconds);
  const [timecode, setTimecode] = useState<string>('00:00:00:00');

  useEffect(() => {
    const updateTimecode = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const f = String(Math.floor(now.getMilliseconds() / 40)).padStart(2, '0');
      setTimecode(`${h}:${m}:${s}:${f}`);
    };
    updateTimecode();
    const interval = setInterval(updateTimecode, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const sessionTimer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(sessionTimer);
          onSessionTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimer);
  }, [isLive, onSessionTimeout]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[5px] bg-[#121817] text-white border-2 border-[#121817] aspect-video flex items-center justify-center select-none shadow-well',
        className
      )}
      {...props}
    >
      {/* Visual media */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Ring viewfinder - ${deviceName}`}
          className="w-full h-full object-cover"
        />
      ) : children ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center text-[#5C6966] gap-2 font-mono">
          <div className="w-10 h-10 rounded border border-[#5C6966]/40 flex items-center justify-center">
            <HardwareLed status="pulsing" color="teal" size="md" />
          </div>
          <span className="text-[11px] tracking-widest uppercase">STANDBY // WHEP LINK</span>
        </div>
      )}

      {/* Broadcast Viewfinder Corner Reticles */}
      <div className="absolute top-2.5 left-2.5 font-mono text-[11px] text-white/50 leading-none pointer-events-none">┌</div>
      <div className="absolute top-2.5 right-2.5 font-mono text-[11px] text-white/50 leading-none pointer-events-none">┐</div>
      <div className="absolute bottom-2.5 left-2.5 font-mono text-[11px] text-white/50 leading-none pointer-events-none">└</div>
      <div className="absolute bottom-2.5 right-2.5 font-mono text-[11px] text-white/50 leading-none pointer-events-none">┘</div>

      {/* Top Bar: Ring Compliance Watermark & Telemetry */}
      <div className="absolute top-0 inset-x-0 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent text-[11px] font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider uppercase text-white/90">ring</span>
          <span className="text-white/30">|</span>
          <span className="text-white/90 uppercase font-semibold">{deviceName}</span>
          <span className="text-white/40 text-[10px]">[{deviceId}]</span>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[#E64A26] font-bold">
              <HardwareLed status="pulsing" color="vermilion" size="sm" />
              REC // {secondsRemaining}s
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-white/70">
              <HardwareLed status="lit" color="teal" size="sm" />
              READY
            </span>
          )}
          <span className="text-white/80 tabular-nums">{timecode}</span>
        </div>
      </div>

      {/* Bottom Bar: Engineering Telemetry */}
      <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent text-[10px] font-mono text-white/60 select-none">
        <span>DOORSIGNAL // PARTNER API WHEP</span>
        <span>RECEIVE-ONLY STREAM // 1080p</span>
      </div>
    </div>
  );
};
