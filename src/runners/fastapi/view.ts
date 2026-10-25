import { MAX_SHOWN_CHARS } from './config';
import type { HttpOutcome, RouteInfo, RunOutput } from '../types';

/** What the Requests panel shows about the app after a Run or a Check. */
export interface AppView {
  /** `started`: the app loaded and started. `error`: it could not, and `error` says why. */
  state: 'started' | 'error';
  routes: RouteInfo[];
  /** The plain-text reason the app could not start, or null. */
  error: string | null;
  /** What the app printed while it started. */
  logs: string[];
}

export function viewOf(output: RunOutput): AppView {
  return {
    state: output.error ? 'error' : 'started',
    routes: output.fastapi?.routes ?? [],
    error: output.error ?? null,
    logs: output.logs,
  };
}

/** "No routes", "1 route", "3 routes". */
export function routesText(count: number): string {
  if (count === 0) return 'no routes';
  return `${count} ${count === 1 ? 'route' : 'routes'}`;
}

export type StatusKind = 'ok' | 'redirect' | 'error';

/** 2xx worked, 3xx sent the client elsewhere, 4xx and 5xx are errors. */
export function statusKind(status: number): StatusKind {
  if (status < 300) return 'ok';
  if (status < 400) return 'redirect';
  return 'error';
}

type Reply = Extract<HttpOutcome, { kind: 'reply' }>;

export interface ShownBody {
  /** The text to show. Empty when the reply has no body. */
  text: string;
  /** True when `text` is JSON that was printed with indentation. */
  json: boolean;
  /** True when `text` was cut at the limit (or the server already cut the body). */
  cut: boolean;
}

/** The reply body as the panel shows it: JSON with indentation, anything else as it came. */
export function shownBody(reply: Pick<Reply, 'body' | 'contentType' | 'truncated'>): ShownBody {
  let text = reply.body;
  let json = false;
  const looksJson = /json/i.test(reply.contentType ?? '') || /^\s*[[{]/.test(text);
  if (looksJson && text.trim() !== '' && !reply.truncated) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
      json = true;
    } catch {
      // Not JSON after all: show it as it came.
    }
  }
  const cut = reply.truncated || text.length > MAX_SHOWN_CHARS;
  if (text.length > MAX_SHOWN_CHARS) text = text.slice(0, MAX_SHOWN_CHARS);
  return { text, json, cut };
}
