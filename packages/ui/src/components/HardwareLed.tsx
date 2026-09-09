import React from 'react';
import { cn } from '../utils';

export interface HardwareLedProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'lit' | 'unlit' | 'pulsing';
  state?: 'active' | 'inactive' | 'pulsing';
  color?: 'teal' | 'vermilion' | 'amber' | 'slate';
  size?: 'sm' | 'md' | 'lg';
}

export const HardwareLed: React.FC<HardwareLedProps> = ({
  className,
  status,
  state,
  color = 'teal',
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const litColors = {
    teal: 'bg-[#12756A] shadow-led-teal',
    vermilion: 'bg-[#E64A26] shadow-led-vermilion',
    amber: 'bg-[#C78B2D] shadow-led-amber',
    slate: 'bg-[#5C6966] shadow-none'
  };

  const unlitColors = {
    teal: 'bg-[#121817]/25',
    vermilion: 'bg-[#121817]/25',
    amber: 'bg-[#121817]/25',
    slate: 'bg-[#121817]/20'
  };

  const effectiveStatus = status || (state === 'active' ? 'lit' : state === 'inactive' ? 'unlit' : state) || 'lit';
  const isLit = effectiveStatus === 'lit' || effectiveStatus === 'pulsing';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center p-[2px] rounded-full bg-[#121817]/10 border border-[#B8C2BD]/50 shadow-well select-none',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'rounded-full transition-all duration-150',
          sizes[size],
          isLit ? litColors[color] : unlitColors[color],
          effectiveStatus === 'pulsing' && 'animate-pulse'
        )}
      />
    </span>
  );
};

