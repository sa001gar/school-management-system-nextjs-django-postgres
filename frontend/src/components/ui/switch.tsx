'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked = false,
  onChange,
  label,
  id: idProp,
  disabled = false,
  className,
}: SwitchProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-amber-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm text-gray-700 leading-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
