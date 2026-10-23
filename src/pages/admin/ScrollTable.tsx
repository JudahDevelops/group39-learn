import type { ReactNode } from 'react';

/**
 * A table that scrolls sideways inside its own box, so the page never does. The box can take focus,
 * which lets a keyboard user scroll it, and it is named by the heading above it. Put the table's
 * `<caption>` first among the children: it describes what the numbers mean.
 */
export function ScrollTable({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-scroll" role="region" aria-labelledby={labelledBy} tabIndex={0}>
      <table className={className ? `admin-table ${className}` : 'admin-table'}>{children}</table>
    </div>
  );
}

/** A table caption that stays in view while the table scrolls sideways beneath it. */
export function Caption({ children }: { children: ReactNode }) {
  return (
    <caption>
      <span>{children}</span>
    </caption>
  );
}
