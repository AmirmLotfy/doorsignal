import React from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  withCornerTicks?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, withCornerTicks = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#FDFAF5] border border-[#D2D8D4] rounded-panel text-[#121817] shadow-sm relative',
          withCornerTicks && 'corner-ticks',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 border-b border-[#D2D8D4]', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';
