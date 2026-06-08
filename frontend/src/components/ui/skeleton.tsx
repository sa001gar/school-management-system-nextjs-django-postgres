import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'circle' | 'rect';
}

function Skeleton({ className, lines = 1, variant = 'text' }: SkeletonProps) {
  if (variant === 'circle') {
    return <div className={cn('animate-pulse rounded-full bg-gray-200', className)} />;
  }

  if (variant === 'rect') {
    return <div className={cn('animate-pulse rounded-lg bg-gray-200', className)} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded bg-gray-200 animate-pulse',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
}

export { Skeleton };
