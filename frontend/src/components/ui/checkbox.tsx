'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  id: idProp,
  disabled = false,
  className,
}: CheckboxProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'h-4 w-4 shrink-0 rounded border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'bg-amber-600 border-amber-600 text-white'
            : 'bg-white border-gray-300 hover:border-gray-400'
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
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
