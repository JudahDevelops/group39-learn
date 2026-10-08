/** Id helpers shared by the parser, the validator and scripts/new-step.ts. */

/** Collapse whitespace so reflowing a question does not change its id. */
export function normalizeForHash(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Stable 8-char id for a quiz question: 32-bit FNV-1a of the normalised question text, as hex.
 * Pure JS so it behaves the same in Node, the browser and Vitest. A collision is caught by the
 * "ids unique across all content" check, never silently accepted.
 */
export function questionId(text: string): string {
  const input = normalizeForHash(text);
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(input);
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Random 8-char id. `rand` returns an integer in [0, max). */
export function randomId(rand: (max: number) => number): string {
  let id = '';
  for (let i = 0; i < 8; i++) id += ALPHABET[rand(ALPHABET.length)];
  return id;
}
