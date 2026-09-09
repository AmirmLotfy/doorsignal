import React from 'react';
import { cn } from '../utils';
import { HardwareLed } from './HardwareLed';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'signal' | 'teal' | 'brass' | 'amber' | 'moss' | 'sage' | 'ember' | 'vermilion' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  children,
  ...props
}) => {
  const variants = {
    teal: 'bg-[#E6F3F1] text-[#12756A] border-[#B8DFDA]',
    signal: 'bg-[#E6F3F1] text-[#12756A] border-[#B8DFDA]',
    amber: 'bg-[#FAF3E8] text-[#C78B2D] border-[#EAD3AE]',
    brass: 'bg-[#FAF3E8] text-[#C78B2D] border-[#EAD3AE]',
    sage: 'bg-[#EAF2EE] text-[#356852] border-[#C3D9CD]',
    moss: 'bg-[#EAF2EE] text-[#356852] border-[#C3D9CD]',
    vermilion: 'bg-[#FCECE8] text-[#E64A26] border-[#F5C2B5]',
    ember: 'bg-[#FCECE8] text-[#E64A26] border-[#F5C2B5]',
    neutral: 'bg-[#F5F2EB] text-[#5C6966] border-[#D2D8D4]',
    outline: 'bg-transparent text-[#5C6966] border-[#D2D8D4]'
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-[11px] px-2 py-0.5'
  };

  const ledColors: Record<string, 'teal' | 'vermilion' | 'amber' | 'slate'> = {
    teal: 'teal',
    signal: 'teal',
    amber: 'amber',
    brass: 'amber',
    sage: 'teal',
    moss: 'teal',
    vermilion: 'vermilion',
    ember: 'vermilion',
    neutral: 'slate',
    outline: 'slate'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] font-semibold border font-mono tracking-tight select-none uppercase',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {withDot && <HardwareLed status="lit" color={ledColors[variant] || 'slate'} size="sm" />}
      {children}
    </span>
  );
};

