import React from 'react';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'signal' | 'secondary' | 'console' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded text-xs select-none transition-all duration-70 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#12756A] active:translate-y-[1px] cursor-pointer tracking-tight';
    
    const variants = {
      primary: 'bg-[#12756A] text-[#FDFAF5] shadow-bevel hover:bg-[#0E5C53] active:bg-[#0A453E]',
      signal: 'bg-[#E64A26] text-[#FDFAF5] shadow-bevel hover:bg-[#D13F1D] active:bg-[#B53517]',
      secondary: 'bg-[#FDFAF5] text-[#121817] border border-[#D2D8D4] shadow-bevel hover:bg-[#F5F2EB] active:bg-[#EAE4D8]',
      console: 'bg-[#121817] text-[#FDFAF5] shadow-bevel-dark hover:bg-[#1A2221] active:bg-[#0C100F] border border-black/20',
      ghost: 'text-[#5C6966] hover:text-[#121817] hover:bg-[#121817]/5',
      danger: 'bg-[#E64A26] text-white shadow-bevel hover:bg-[#D13F1D]'
    };

    const sizes = {
      sm: 'h-7 px-2.5 gap-1.5 font-mono text-[11px]',
      md: 'h-8 px-3.5 gap-2 font-mono text-xs',
      lg: 'h-9 px-4 gap-2 text-sm'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
