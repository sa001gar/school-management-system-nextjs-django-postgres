import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
            {isLast || !item.href ? (
              <span className="text-gray-500 font-medium truncate" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-amber-600 hover:text-amber-700 hover:underline truncate"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
