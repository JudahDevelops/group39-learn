/**
 * validate:content only checks that widget props are a JSON object. These tests read the props of every
 * widget screen in the fixture lessons, and the examples in docs/content-format.md, with the widgets' own
 * parsers, so a bad prop is caught here and not by a learner.
 */
import { describe, expect, it } from 'vitest';
import { loadContent, type ContentFiles } from '../../src/content/validate';
import { parseEscalationProps } from '../../src/screens/widgets/escalation';
import { parseExchangeProps } from '../../src/screens/widgets/exchange';
import { parseSorterProps } from '../../src/screens/widgets/sorter';
import { parseTracerProps } from '../../src/screens/widgets/tracer';

const PARSERS: Record<string, (props: unknown) => unknown> = {
  'escalation-slider': parseEscalationProps,
  'tier-sorter': parseSorterProps,
  'data-flow-tracer': parseTracerProps,
  'request-response': parseExchangeProps,
};

const raw = import.meta.glob<string>('../../content/**/*.{md,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const files: ContentFiles = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace('../../content/', ''), text]),
);
const result = loadContent(files);

const docs = Object.values(
  import.meta.glob<string>('../../docs/content-format.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)[0];

function widgetScreens(slug: string) {
  const block = [...result.blocks.values()].find((b) => b.meta.slug === slug);
  if (block?.type !== 'lesson') throw new Error(`no fixture lesson "${slug}"`);
  return block.lesson.screens.filter((screen) => screen.type === 'widget');
}

describe('fixture-widgets lesson', () => {
  const screens = widgetScreens('fixture-widgets');

  it('shows every registered widget, and the slider both ways', () => {
    const names = screens.map((screen) => screen.name);
    expect(new Set(names)).toEqual(new Set(Object.keys(PARSERS)));
    const sliders = screens.filter((screen) => screen.name === 'escalation-slider');
    expect(sliders.map((screen) => 'target' in screen.props)).toEqual([false, true]);
  });

  it.each(Object.keys(PARSERS))('the %s props can be read', (name) => {
    for (const screen of screens.filter((s) => s.name === name)) {
      expect(() => PARSERS[name](screen.props)).not.toThrow();
    }
  });

  it('puts real IHMS data in the sorter and the tracer: four tiers, every tier used', () => {
    const sorter = parseSorterProps(screens.find((s) => s.name === 'tier-sorter')!.props);
    const tracer = parseTracerProps(screens.find((s) => s.name === 'data-flow-tracer')!.props);
    expect(sorter.tiers).toEqual(['Client', 'Logic', 'Data', 'Output']);
    expect(new Set(sorter.cards.map((c) => c.tier))).toEqual(new Set([0, 1, 2, 3]));
    expect(tracer.tiers).toEqual(sorter.tiers);
    expect(new Set(tracer.steps.map((s) => s.tier))).toEqual(new Set([0, 1, 2, 3]));
  });
});

describe('fixture-lesson widget screen', () => {
  it('still reads: the explorer shape from the first version of the widget contract', () => {
    const [screen] = widgetScreens('fixture-lesson');
    expect(screen.name).toBe('escalation-slider');
    expect(parseEscalationProps(screen.props)).toEqual({ deadlineHours: 24, maxHours: 72 });
  });
});

describe('docs/content-format.md widget examples', () => {
  const examples = [...docs.matchAll(/## --widget-- ([\w-]+)\n\n`{3}json\n([\s\S]*?)\n`{3}/g)];

  it('has an example for each widget, and every one can be read', () => {
    expect(new Set(examples.map((m) => m[1]))).toEqual(new Set(Object.keys(PARSERS)));
    for (const [, name, json] of examples) {
      expect(() => PARSERS[name](JSON.parse(json)), name).not.toThrow();
    }
  });
});
