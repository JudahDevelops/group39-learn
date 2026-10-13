/**
 * Reading a widget's JSON props. The props come straight from a lesson's fenced block and nothing has
 * checked their shape, so every widget reads them through these helpers. A bad value throws an Error that
 * says what is wrong; the widget boundary in WidgetScreen catches it and shows "This interactive part
 * could not load."
 */

export type PropObject = Record<string, unknown>;

export function asObject(value: unknown, what: string): PropObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${what} must be an object`);
  }
  return value as PropObject;
}

/** A non-empty string. Widget text is plain text, not markdown. */
export function asText(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${what} must be a non-empty string`);
  }
  return value;
}

export function asWholeNumber(
  value: unknown,
  what: string,
  limits: { min?: number; max?: number } = {},
): number {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = limits;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${what} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

export function asList(
  value: unknown,
  what: string,
  limits: { min?: number; max?: number } = {},
): unknown[] {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = limits;
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`${what} must be a list of ${min} to ${max} items`);
  }
  return value;
}

/** A list of different non-empty strings. */
export function asTextList(
  value: unknown,
  what: string,
  limits: { min?: number; max?: number } = {},
): string[] {
  const items = asList(value, what, limits).map((item, i) => asText(item, `${what}[${i}]`));
  if (new Set(items).size !== items.length) throw new Error(`${what} must not repeat a value`);
  return items;
}

/** A value that is valid JSON data and can be shown as a request or response body. */
export function asBody(value: unknown, what: string): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object') throw new Error(`${what} must be an object, a list or null`);
  return value;
}

/** "1 hour", "5 hours": the noun agrees with the count. */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
