/**
 * The escalation rule of the triage engine, as pure functions (course-content.md, lesson 3.5, and
 * equation 1 of the paper). t is the time the complaint has been open and d is its deadline, both in
 * hours:
 *   L = 0 if t < d, L = 1 if d <= t < 2d, L = 2 if t >= 2d.
 * The deadline d comes from the urgency (Table IV): urgent 24 hours, normal 72 hours, low 7 days.
 */
import { asObject, asWholeNumber, plural } from './props';

export const DEADLINE_HOURS = [24, 72, 168] as const;
export type DeadlineHours = (typeof DEADLINE_HOURS)[number];
export type Level = 0 | 1 | 2;
/** The level a scored slider asks for. Level 0 is where every complaint starts, so it is not asked. */
export type TargetLevel = 1 | 2;

export function escalationLevel(t: number, d: number): Level {
  if (t < d) return 0;
  return t < 2 * d ? 1 : 2;
}

/** The first hour at which the complaint is at `level`: 0, d or 2d. */
export function levelStart(level: Level, d: number): number {
  return level * d;
}

export function urgencyOf(d: DeadlineHours): 'Urgent' | 'Normal' | 'Low' {
  return d === 24 ? 'Urgent' : d === 72 ? 'Normal' : 'Low';
}

/** Hours, or days as well once the span is a whole number of weeks ("7 days (168 hours)"). */
export function formatHours(hours: number): string {
  if (hours >= 168 && hours % 24 === 0)
    return `${plural(hours / 24, 'day')} (${plural(hours, 'hour')})`;
  return plural(hours, 'hour');
}

/** Who has been emailed by level L. */
export function emailedAt(level: Level): string[] {
  if (level === 0) return [];
  return level === 1 ? ['hall warden'] : ['hall warden', 'Student Affairs'];
}

/** The row in the readout: "Nobody", "Hall warden", "Hall warden and Student Affairs". */
export function emailedText(level: Level): string {
  const who = emailedAt(level);
  if (who.length === 0) return 'Nobody';
  const text = who.join(' and ');
  return text[0].toUpperCase() + text.slice(1);
}

/** What happens at each level, in the words of the course. */
export function levelText(level: Level): string {
  if (level === 0) return 'Still within the deadline. Nothing happens.';
  if (level === 1) return 'Overdue. The hall warden is emailed.';
  return 'Overdue twice over. Student Affairs is emailed and the complaint is flagged on the Admin Dashboard.';
}

/** The sentence the scored mode asks. */
export function taskText(target: TargetLevel): string {
  return target === 1
    ? 'Move the slider to the first moment the hall warden is emailed.'
    : 'Move the slider to the first moment Student Affairs is emailed.';
}

export interface EscalationProps {
  deadlineHours: DeadlineHours;
  /** The right end of the slider. It must be past 2d, so the timeline shows all three levels. */
  maxHours: number;
  /** Present in the scored mode. */
  target?: TargetLevel;
}

/** Reads the props of the `escalation-slider` widget, or throws. */
export function parseEscalationProps(raw: unknown): EscalationProps {
  const props = asObject(raw, 'props');
  const d = props.deadlineHours;
  if (!(DEADLINE_HOURS as readonly unknown[]).includes(d)) {
    throw new Error(`deadlineHours must be one of ${DEADLINE_HOURS.join(', ')}`);
  }
  const deadlineHours = d as DeadlineHours;
  const maxHours = asWholeNumber(props.maxHours, 'maxHours', {
    min: 2 * deadlineHours + 1,
    max: 1000,
  });
  const result: EscalationProps = { deadlineHours, maxHours };
  if (props.target !== undefined) {
    if (props.target !== 1 && props.target !== 2) throw new Error('target must be 1 or 2');
    result.target = props.target;
  }
  return result;
}

export interface SlideVerdict {
  correct: boolean;
  /** Shown in the "Not quite" sheet. Empty when correct. */
  note: string;
}

/**
 * The scored mode is right when the slider sits on the first hour of the target level (d for level 1, 2d
 * for level 2), at a slider step of one hour. The note says where the slider stopped and which side of
 * the answer it is on, without giving the answer itself.
 */
export function scoreSlide(t: number, d: number, target: TargetLevel): SlideVerdict {
  const start = levelStart(target, d);
  if (t === start) return { correct: true, note: '' };
  const now = escalationLevel(t, d);
  const status =
    now === 0
      ? 'nobody has been emailed yet'
      : now === 1
        ? 'the hall warden has been emailed'
        : 'the hall warden and Student Affairs have been emailed';
  const who = target === 1 ? 'the hall warden' : 'Student Affairs';
  const stopped = `You stopped at ${formatHours(t)}, when ${status}.`;
  return {
    correct: false,
    note:
      t < start
        ? `${stopped} That is before ${who} is first emailed.`
        : `${stopped} ${who[0].toUpperCase()}${who.slice(1)} was emailed earlier than that.`,
  };
}
