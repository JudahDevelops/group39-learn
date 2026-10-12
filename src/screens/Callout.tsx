import type { ReactNode } from 'react';
import { Html } from './Html';
import { InfoIcon, TipIcon, WarningIcon } from './Icons';

const KINDS = {
  info: { label: 'Info', icon: <InfoIcon /> },
  tip: { label: 'Tip', icon: <TipIcon /> },
  warning: { label: 'Warning', icon: <WarningIcon /> },
} as const satisfies Record<string, { label: string; icon: ReactNode }>;

/** A note under a concept. Colour carries state only, so the kind is told by its icon and a hidden label. */
export function Callout({ kind, html }: { kind: keyof typeof KINDS; html: string }) {
  const { label, icon } = KINDS[kind];
  return (
    <aside className={`callout callout-${kind}`}>
      {icon}
      <span className="sr-only">{label}: </span>
      <Html html={html} className="callout-body" />
    </aside>
  );
}
