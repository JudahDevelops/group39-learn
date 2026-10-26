/** Times for the project page. Everything is read in Africa/Lagos time, like the rest of the app. */

const LAGOS = 'Africa/Lagos';

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const day = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const clock24 = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "3:42 pm" in Lagos time. */
export function lagosClock(at: Date): string {
  return clock.format(at);
}

/**
 * What follows "Checked": "just now", "1 minute ago", "3 hours ago", and from a day on the date,
 * "on 23 Oct 2026 at 14:05". Empty when the timestamp is not a date.
 */
export function checkedWhen(iso: string, now: Date): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const minutes = Math.floor((now.getTime() - ms) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  return `on ${day.format(ms)} at ${clock24.format(ms)}`;
}
