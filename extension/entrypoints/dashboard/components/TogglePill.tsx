import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TogglePillProps {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  count?: number;
  disabled?: boolean;
  /**
   * "filter" (default) — blue accent, for view modifiers (unseen/starred/grouped/keywords)
   * "nav" — dark slate, for navigation/source selection (subscriptions)
   */
  variant?: 'filter' | 'nav';
}

export function TogglePill({
  active,
  onClick,
  icon,
  label,
  count,
  disabled,
  variant = 'filter',
}: TogglePillProps) {
  const isNav = variant === 'nav';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        isNav
          ? [
              'focus-visible:ring-slate-500',
              active
                ? 'bg-slate-800 text-white hover:bg-slate-900'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-400 hover:bg-slate-50',
            ]
          : [
              'focus-visible:ring-blue-500',
              active
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
            isNav
              ? active
                ? 'bg-slate-600 text-slate-200'
                : 'bg-slate-100 text-slate-600'
              : active
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-700'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
