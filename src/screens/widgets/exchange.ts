/**
 * Logic for the request and response walk-through (lesson 3.1): a request goes from the browser to the
 * server to the database, and the response comes back the same way. The learner steps through the stops
 * with Back and Next. Pure functions only.
 */
import { asBody, asList, asObject, asText, asWholeNumber } from './props';

export interface Stop {
  label: string;
  /** The name of the box the stop happens in, e.g. "Browser". */
  tier: string;
}

export interface ExchangeProps {
  request: { method: string; path: string; body: unknown };
  response: { status: number; statusText: string; body: unknown };
  stops: Stop[];
  /** The distinct tiers of the stops, in the order the request reaches them. */
  tiers: string[];
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function tiersOf(stops: readonly Stop[]): string[] {
  return [...new Set(stops.map((stop) => stop.tier))];
}

/**
 * The index of the stop where the request turns round: the first stop in the deepest box. Stops up to
 * and including it belong to the request; later stops belong to the response.
 */
export function turnIndex(stops: readonly Stop[]): number {
  const tiers = tiersOf(stops);
  let deepest = -1;
  let turn = 0;
  stops.forEach((stop, i) => {
    const depth = tiers.indexOf(stop.tier);
    if (depth > deepest) {
      deepest = depth;
      turn = i;
    }
  });
  return turn;
}

export type Phase = 'request' | 'response';

export function phaseAt(stops: readonly Stop[], index: number): Phase {
  return index <= turnIndex(stops) ? 'request' : 'response';
}

/** Reads the props of the `request-response` widget, or throws. */
export function parseExchangeProps(raw: unknown): ExchangeProps {
  const props = asObject(raw, 'props');

  const request = asObject(props.request, 'request');
  const method = asText(request.method, 'request.method');
  if (!(METHODS as readonly string[]).includes(method)) {
    throw new Error(`request.method must be one of ${METHODS.join(', ')}`);
  }
  const path = asText(request.path, 'request.path');
  if (!path.startsWith('/')) throw new Error('request.path must start with "/"');

  const response = asObject(props.response, 'response');
  const status = asWholeNumber(response.status, 'response.status', { min: 100, max: 599 });
  const statusText = asText(response.statusText, 'response.statusText');

  const stops = asList(props.stops, 'stops', { min: 3, max: 12 }).map((item, i): Stop => {
    const stop = asObject(item, `stops[${i}]`);
    return {
      label: asText(stop.label, `stops[${i}].label`),
      tier: asText(stop.tier, `stops[${i}].tier`),
    };
  });
  const tiers = tiersOf(stops);
  if (tiers.length < 2 || tiers.length > 5) {
    throw new Error('stops must visit between 2 and 5 different tiers');
  }
  if (turnIndex(stops) >= stops.length - 1) {
    throw new Error('stops must come back after the deepest tier, so the response has a stop');
  }

  return {
    request: { method, path, body: asBody(request.body, 'request.body') },
    response: { status, statusText, body: asBody(response.body, 'response.body') },
    stops,
    tiers,
  };
}

/** Pretty JSON with two-space indents, as in the course. */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** `POST /api/complaints`, then the body when there is one. */
export function requestText(request: ExchangeProps['request']): string {
  const line = `${request.method} ${request.path}`;
  return request.body === null ? line : `${line}\n${formatJson(request.body)}`;
}

/** `201 Created`, then the body when there is one. */
export function responseText(response: ExchangeProps['response']): string {
  const line = `${response.status} ${response.statusText}`;
  return response.body === null ? line : `${line}\n${formatJson(response.body)}`;
}
