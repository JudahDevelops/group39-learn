/**
 * Small inline icons. Each one is drawn with currentColor, so the colour comes from the surrounding
 * state (door for right, biro for wrong), and each is hidden from screen readers: the words beside it
 * (or a visually hidden label) carry the meaning.
 */
import type { ReactNode } from 'react';

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CheckIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 10.5 8.2 14.5 16 5.5" />
    </Icon>
  );
}

export function CrossIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M5 5 15 15M15 5 5 15" />
    </Icon>
  );
}

export function UpIcon() {
  return (
    <Icon>
      <path d="M4.5 12.5 10 7l5.5 5.5" />
    </Icon>
  );
}

export function DownIcon() {
  return (
    <Icon>
      <path d="M4.5 7.5 10 13l5.5-5.5" />
    </Icon>
  );
}

export function InfoIcon() {
  return (
    <Icon>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9.2v4.6M10 6.3v.2" />
    </Icon>
  );
}

export function TipIcon() {
  return (
    <Icon>
      <path d="M7 14.5h6M8 17h4M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.1 1 2h4c0-.9.4-1.5 1-2a5 5 0 0 0-3-9Z" />
    </Icon>
  );
}

export function WarningIcon() {
  return (
    <Icon>
      <path d="M10 3 2.5 16.5h15L10 3ZM10 8.5v4M10 14.6v.2" />
    </Icon>
  );
}
