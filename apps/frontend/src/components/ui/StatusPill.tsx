import type { ReactNode } from 'react';

export type StatusTone = 'forest' | 'mist' | 'gold' | 'clay';

interface StatusPillProps {
  tone?: StatusTone;
  children: ReactNode;
}

const toneClasses: Record<StatusTone, string> = {
  forest: 'bg-forest-soft text-forest-dark border-forest/20',
  mist: 'bg-mist text-ink-soft border-mist-dark/50',
  gold: 'bg-gold-soft text-gold-dark border-gold/20',
  clay: 'bg-clay-soft text-clay-dark border-clay/20',
};

export function StatusPill({ tone = 'mist', children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}