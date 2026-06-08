'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { Button } from './button';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const variantConfig: Record<
  AlertVariant,
  { container: string; icon: React.ReactNode; iconColor: string }
> = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: <Info className="h-5 w-5" />,
    iconColor: 'text-blue-600',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 className="h-5 w-5" />,
    iconColor: 'text-green-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: <AlertCircle className="h-5 w-5" />,
    iconColor: 'text-yellow-600',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: <TriangleAlert className="h-5 w-5" />,
    iconColor: 'text-red-600',
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, message, onClose, className }: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn('rounded-lg border p-4 flex gap-3', config.container, className)}
    >
      <div className={cn('shrink-0 mt-0.5', config.iconColor)}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-gray-900">{title}</h4>}
        <p className={cn('text-sm text-gray-700', title && 'mt-1')}>{message}</p>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="shrink-0 -mt-1 -mr-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
