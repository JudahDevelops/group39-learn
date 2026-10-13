/** The escalation rule and the slider's scored mode (course-content.md lesson 3.5, equation 1 of the paper). */
import { describe, expect, it } from 'vitest';
import {
  DEADLINE_HOURS,
  emailedAt,
  emailedText,
  escalationLevel,
  formatHours,
  levelStart,
  levelText,
  parseEscalationProps,
  scoreSlide,
  taskText,
  urgencyOf,
} from '../../src/screens/widgets/escalation';

describe('escalationLevel', () => {
  it.each(DEADLINE_HOURS)('d = %i: L is 0 before d, 1 from d until 2d, 2 from 2d on', (d) => {
    expect(escalationLevel(0, d)).toBe(0);
    expect(escalationLevel(d - 1, d)).toBe(0);
    expect(escalationLevel(d, d)).toBe(1);
    expect(escalationLevel(2 * d - 1, d)).toBe(1);
    expect(escalationLevel(2 * d, d)).toBe(2);
    expect(escalationLevel(2 * d + 1, d)).toBe(2);
    expect(escalationLevel(10 * d, d)).toBe(2);
  });

  it('matches the worksheet answers in lesson 3.5', () => {
    expect(escalationLevel(12, 24)).toBe(0); // a: urgent, Mon 08:00 to Mon 20:00
    expect(escalationLevel(25, 24)).toBe(1); // b: urgent, 25 hours
    expect(escalationLevel(96, 72)).toBe(1); // c: normal, Fri 08:00
    expect(escalationLevel(144, 72)).toBe(2); // d: normal, Sun 08:00
    expect(escalationLevel(9 * 24, 168)).toBe(1); // e: low, 9 days
  });

  it('matches the check-yourself question: urgent and 30 hours old is level 1', () => {
    expect(escalationLevel(30, 24)).toBe(1);
  });

  it('levelStart is 0, d and 2d', () => {
    expect([0, 1, 2].map((level) => levelStart(level as 0 | 1 | 2, 72))).toEqual([0, 72, 144]);
  });
});

describe('who is emailed', () => {
  it('nobody, then the hall warden, then the hall warden and Student Affairs', () => {
    expect(emailedAt(0)).toEqual([]);
    expect(emailedAt(1)).toEqual(['hall warden']);
    expect(emailedAt(2)).toEqual(['hall warden', 'Student Affairs']);
    expect([0, 1, 2].map((level) => emailedText(level as 0 | 1 | 2))).toEqual([
      'Nobody',
      'Hall warden',
      'Hall warden and Student Affairs',
    ]);
  });

  it('describes each level in the words of the course', () => {
    expect(levelText(0)).toBe('Still within the deadline. Nothing happens.');
    expect(levelText(1)).toBe('Overdue. The hall warden is emailed.');
    expect(levelText(2)).toContain('Student Affairs is emailed');
    expect(levelText(2)).toContain('flagged on the Admin Dashboard');
  });
});

describe('labels', () => {
  it('names the urgency of each deadline (Table IV)', () => {
    expect(DEADLINE_HOURS.map(urgencyOf)).toEqual(['Urgent', 'Normal', 'Low']);
  });

  it('formats hours, and days for whole weeks', () => {
    expect(formatHours(0)).toBe('0 hours');
    expect(formatHours(1)).toBe('1 hour');
    expect(formatHours(24)).toBe('24 hours');
    expect(formatHours(144)).toBe('144 hours');
    expect(formatHours(168)).toBe('7 days (168 hours)');
    expect(formatHours(336)).toBe('14 days (336 hours)');
    expect(formatHours(200)).toBe('200 hours');
  });

  it('words the task for each target', () => {
    expect(taskText(1)).toBe('Move the slider to the first moment the hall warden is emailed.');
    expect(taskText(2)).toBe('Move the slider to the first moment Student Affairs is emailed.');
  });
});

describe('parseEscalationProps', () => {
  it('reads the explorer shape the fixture lesson uses', () => {
    expect(parseEscalationProps({ deadlineHours: 24, maxHours: 72 })).toEqual({
      deadlineHours: 24,
      maxHours: 72,
    });
  });

  it('reads the scored shape', () => {
    expect(parseEscalationProps({ deadlineHours: 72, maxHours: 216, target: 1 })).toEqual({
      deadlineHours: 72,
      maxHours: 216,
      target: 1,
    });
  });

  it.each([
    ['not an object', 'text'],
    ['a list', []],
    ['a deadline that is not 24, 72 or 168', { deadlineHours: 48, maxHours: 200 }],
    ['no deadline', { maxHours: 72 }],
    ['a deadline given as text', { deadlineHours: '24', maxHours: 72 }],
    ['no maxHours', { deadlineHours: 24 }],
    ['a maxHours that does not pass 2d', { deadlineHours: 24, maxHours: 48 }],
    ['a maxHours with a fraction', { deadlineHours: 24, maxHours: 72.5 }],
    ['a target of 0', { deadlineHours: 24, maxHours: 72, target: 0 }],
    ['a target of 3', { deadlineHours: 24, maxHours: 72, target: 3 }],
    ['a target given as text', { deadlineHours: 24, maxHours: 72, target: '1' }],
  ])('throws for %s', (_what, bad) => {
    expect(() => parseEscalationProps(bad)).toThrow();
  });
});

describe('scoreSlide', () => {
  it.each(DEADLINE_HOURS)('d = %i: only the first hour of the target level is correct', (d) => {
    for (const target of [1, 2] as const) {
      for (let t = 0; t <= 2 * d + 10; t += 1) {
        expect(scoreSlide(t, d, target).correct, `t=${t} target=${target}`).toBe(t === target * d);
      }
    }
  });

  it('is correct with no note at the start of level 1 and of level 2', () => {
    expect(scoreSlide(72, 72, 1)).toEqual({ correct: true, note: '' });
    expect(scoreSlide(144, 72, 2)).toEqual({ correct: true, note: '' });
  });

  it('says the slider is too early, and who has been emailed there', () => {
    const early = scoreSlide(40, 72, 1);
    expect(early.correct).toBe(false);
    expect(early.note).toBe(
      'You stopped at 40 hours, when nobody has been emailed yet. That is before the hall warden is first emailed.',
    );
    expect(scoreSlide(100, 72, 2).note).toBe(
      'You stopped at 100 hours, when the hall warden has been emailed. That is before Student Affairs is first emailed.',
    );
  });

  it('says the slider is too late', () => {
    expect(scoreSlide(73, 72, 1).note).toBe(
      'You stopped at 73 hours, when the hall warden has been emailed. The hall warden was emailed earlier than that.',
    );
    expect(scoreSlide(150, 72, 2).note).toBe(
      'You stopped at 150 hours, when the hall warden and Student Affairs have been emailed. Student Affairs was emailed earlier than that.',
    );
  });

  it('does not give the answer away in the note', () => {
    expect(scoreSlide(40, 72, 1).note).not.toContain('72');
  });
});
