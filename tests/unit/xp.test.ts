import { describe, expect, it } from 'vitest';
import {
  MAX_XP_PER_EVENT,
  XP,
  XP_REASONS,
  isXpReason,
  streakDays,
  todayXp,
  weeklyXp,
} from '../../src/lib/xp';
import type { XpEvent } from '../../src/store/types';

function ev(createdAt: string, amount = 10): XpEvent {
  return { userId: 'u1', itemId: 'item', reason: 'lesson', amount, createdAt };
}

describe('streakDays', () => {
  it('counts a single day as a streak of 1', () => {
    const now = new Date('2026-10-08T10:00:00Z'); // 11:00 Lagos
    const events = [ev('2026-10-08T06:00:00Z')]; // 07:00 Lagos, same Lagos day
    expect(streakDays(events, now)).toBe(1);
  });

  it('treats 23:30 UTC as the next Lagos day (Lagos midnight boundary)', () => {
    // 2026-10-07T23:30:00Z = 2026-10-08T00:30:00 Lagos -> counts for Oct 8, not Oct 7.
    const now = new Date('2026-10-08T12:00:00Z');
    const events = [ev('2026-10-07T23:30:00Z')];
    expect(streakDays(events, now)).toBe(1);
  });

  it('does not count 22:30 UTC as the next Lagos day', () => {
    // 2026-10-07T22:30:00Z = 2026-10-07T23:30:00 Lagos -> still Oct 7.
    const now = new Date('2026-10-07T23:00:00Z'); // 2026-10-08T00:00 Lagos
    const events = [ev('2026-10-07T22:30:00Z')];
    // "now" is already into Oct 8 Lagos day with no XP yet today, but
    // yesterday (Oct 7) has XP, so the streak is still alive -> 1.
    expect(streakDays(events, now)).toBe(1);
  });

  it('breaks the streak across a missed day', () => {
    const now = new Date('2026-10-08T10:00:00Z'); // Oct 8 Lagos
    const events = [
      ev('2026-10-08T06:00:00Z'), // Oct 8
      ev('2026-10-06T06:00:00Z'), // Oct 6 (gap on Oct 7)
    ];
    expect(streakDays(events, now)).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const now = new Date('2026-10-08T10:00:00Z'); // Oct 8 Lagos
    const events = [
      ev('2026-10-08T06:00:00Z'),
      ev('2026-10-07T06:00:00Z'),
      ev('2026-10-06T06:00:00Z'),
    ];
    expect(streakDays(events, now)).toBe(3);
  });

  it('yesterday-only run stays alive: no XP today, yesterday+before do', () => {
    // Opening the app in the morning before earning XP must not show 0.
    const now = new Date('2026-10-08T10:00:00Z'); // Oct 8 Lagos, no events today
    const events = [ev('2026-10-07T06:00:00Z'), ev('2026-10-06T06:00:00Z')];
    expect(streakDays(events, now)).toBe(2);
  });

  it('gap of two days resets to 0', () => {
    // No XP today (Oct 8) and none yesterday (Oct 7) either -> broken.
    const now = new Date('2026-10-08T10:00:00Z');
    const events = [ev('2026-10-05T06:00:00Z'), ev('2026-10-04T06:00:00Z')];
    expect(streakDays(events, now)).toBe(0);
  });
});

describe('todayXp', () => {
  it('sums only events within the Lagos calendar day', () => {
    const now = new Date('2026-10-08T10:00:00Z'); // Oct 8 Lagos
    const events = [
      ev('2026-10-08T06:00:00Z', 10),
      ev('2026-10-08T20:00:00Z', 5), // 21:00 Lagos, still Oct 8
      ev('2026-10-07T20:00:00Z', 100), // 21:00 Lagos Oct 7, excluded
    ];
    expect(todayXp(events, now)).toBe(15);
  });
});

describe('weeklyXp', () => {
  it('rolls over at Monday 00:00 Lagos', () => {
    // Monday 2026-10-05 is the week start for Oct 5-11.
    // Sunday 2026-10-04T23:30:00Z Lagos = 2026-10-05T00:30 -> falls into the NEW week (Oct 5-11).
    const now = new Date('2026-10-08T10:00:00Z'); // Thursday Oct 8, within week of Oct 5
    const events = [
      ev('2026-10-04T23:30:00Z', 20), // Lagos Oct 5 00:30 -> IN this week
      ev('2026-10-04T20:00:00Z', 999), // Lagos Oct 4 21:00 -> previous week, excluded
      ev('2026-10-08T06:00:00Z', 10), // Thursday, in week
    ];
    expect(weeklyXp(events, now)).toBe(30);
  });

  it('excludes events from the following Monday', () => {
    const now = new Date('2026-10-08T10:00:00Z'); // Thursday Oct 8 week
    const events = [
      ev('2026-10-11T23:30:00Z', 999), // Lagos Oct 12 00:30 -> next week, excluded
    ];
    expect(weeklyXp(events, now)).toBe(0);
  });

  it('sums a full Monday-Sunday week', () => {
    const now = new Date('2026-10-05T06:00:00Z'); // Monday
    const events = [
      ev('2026-10-05T06:00:00Z', 10), // Mon
      ev('2026-10-07T06:00:00Z', 10), // Wed
      ev('2026-10-11T22:00:00Z', 10), // Sunday 23:00 Lagos, still in week
    ];
    expect(weeklyXp(events, now)).toBe(30);
  });
});

describe('XP_REASONS', () => {
  it('is the list the database accepts, in order', () => {
    expect([...XP_REASONS]).toEqual([
      'lesson',
      'lesson_perfect',
      'step',
      'lab',
      'quiz',
      'project',
      'exam',
    ]);
  });

  it('recognises each reason and nothing else', () => {
    for (const reason of XP_REASONS) expect(isXpReason(reason)).toBe(true);
    expect(isXpReason('workshop_step')).toBe(false);
    expect(isXpReason('')).toBe(false);
  });

  it('allows the biggest award in the XP table', () => {
    expect(Math.max(...Object.values(XP))).toBe(MAX_XP_PER_EVENT);
  });
});
