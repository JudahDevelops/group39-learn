/**
 * Zod schemas and TS types for every content type. The authoring guide is
 * docs/content-format.md; this file is what enforces it.
 *
 * Conventions:
 * - Anything called `html` (or a field documented as HTML) was rendered from markdown at build time.
 *   It is trusted and goes straight into the page.
 * - Rules that only need one object live here as `superRefine`. Rules that need several files
 *   (unique ids, step numbering, curriculum vs folders) live in validate.ts.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives

/** 8 lowercase letters/digits. Block ids, step ids and quiz question ids all use this shape. */
export const ID_RE = /^[0-9a-z]{8}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RUNNERS = ['web', 'python', 'sql', 'fastapi', 'none'] as const;
export const RunnerSchema = z.enum(RUNNERS);
export type Runner = z.infer<typeof RunnerSchema>;
/** A runner that can execute code (everything except `none`). */
export const CodeRunnerSchema = z.enum(['web', 'python', 'sql', 'fastapi']);
export type CodeRunner = z.infer<typeof CodeRunnerSchema>;

/** The fence language every test block must use, per runner. */
export const TEST_LANG: Record<CodeRunner, 'js' | 'py'> = {
  web: 'js',
  python: 'py',
  sql: 'js',
  fastapi: 'py',
};

export const BLOCK_TYPES = [
  'lesson',
  'workshop',
  'lab',
  'review',
  'quiz',
  'project',
  'exam',
] as const;
export const BlockTypeSchema = z.enum(BLOCK_TYPES);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const IdSchema = z.string().regex(ID_RE, 'must be 8 lowercase letters or digits');
export const SlugSchema = z
  .string()
  .regex(SLUG_RE, 'must be lowercase words joined by hyphens, e.g. "student-profile"');
const NonEmpty = z.string().min(1, 'must not be empty');
/** Rendered HTML (from markdown). */
const Html = z.string().min(1, 'must not be empty');

// ---------------------------------------------------------------------------
// Curriculum: tracks -> chapters -> block slugs (content/curriculum.json)

export const TrackIdSchema = z.enum(['A', 'B', 'Z']);
export type TrackId = z.infer<typeof TrackIdSchema>;

export const ChapterSchema = z.object({
  id: z.string().regex(/^[A-Z]\d+$/, 'must be a track letter plus a number, e.g. "B1"'),
  title: NonEmpty,
  blocks: z.array(SlugSchema).min(1, 'a chapter needs at least one block'),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const TrackSchema = z
  .object({
    id: TrackIdSchema,
    title: NonEmpty,
    /** Dev/test-only content. Left out of the build unless INCLUDE_FIXTURES=1. */
    fixture: z.boolean().optional(),
    chapters: z.array(ChapterSchema).min(1),
  })
  .superRefine((track, ctx) => {
    if (track.id === 'Z' && track.fixture !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fixture'],
        message: 'track "Z" is reserved for fixtures and must set "fixture": true',
      });
    }
    track.chapters.forEach((chapter, i) => {
      if (!chapter.id.startsWith(track.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['chapters', i, 'id'],
          message: `chapter id "${chapter.id}" must start with its track id "${track.id}"`,
        });
      }
    });
  });
export type Track = z.infer<typeof TrackSchema>;

export const CurriculumSchema = z
  .object({ tracks: z.array(TrackSchema).min(1) })
  .superRefine((curriculum, ctx) => {
    const trackIds = new Set<string>();
    const chapterIds = new Set<string>();
    const slugs = new Set<string>();
    curriculum.tracks.forEach((track, ti) => {
      if (trackIds.has(track.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tracks', ti, 'id'],
          message: `duplicate track id "${track.id}"`,
        });
      }
      trackIds.add(track.id);
      track.chapters.forEach((chapter, ci) => {
        if (chapterIds.has(chapter.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tracks', ti, 'chapters', ci, 'id'],
            message: `duplicate chapter id "${chapter.id}"`,
          });
        }
        chapterIds.add(chapter.id);
        chapter.blocks.forEach((slug, bi) => {
          if (slugs.has(slug)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['tracks', ti, 'chapters', ci, 'blocks', bi],
              message: `block "${slug}" is listed more than once`,
            });
          }
          slugs.add(slug);
        });
      });
    });
  });
export type Curriculum = z.infer<typeof CurriculumSchema>;

// ---------------------------------------------------------------------------
// Block meta (content/blocks/<slug>/meta.json)

export const BlockMetaSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    type: BlockTypeSchema,
    title: NonEmpty,
    runner: RunnerSchema,
    estMinutes: z.number().int().positive(),
    /** Where the content came from, e.g. "course-content.md:1542-1798". */
    sourceRef: NonEmpty.optional(),
    /** Workshop and lab only: file name (in the solution) the "example project" opens. */
    demo: NonEmpty.optional(),
    /** Optional blocks do not count against completion. */
    optional: z.boolean().optional(),
  })
  .strict();
export type BlockMeta = z.infer<typeof BlockMetaSchema>;

// ---------------------------------------------------------------------------
// Code files

const FileNameSchema = z
  .string()
  .regex(/^(?!\/)(?!.*\.\.)[A-Za-z0-9_./-]+$/, 'must be a relative file name such as "index.html"');

/** Half-open, 0-based line range into `contents.split("\n")`: lines start..end-1 are editable. */
export const EditableRangeSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(1),
  })
  .refine((r) => r.end > r.start, 'the editable region must contain at least one line');
export type EditableRange = z.infer<typeof EditableRangeSchema>;

const SeedFileBase = z.object({
  name: FileNameSchema,
  lang: NonEmpty,
  /** File text with `--editable-region--` marker lines already removed. */
  contents: z.string(),
  editable: EditableRangeSchema.optional(),
});

export const SeedFileSchema = SeedFileBase.superRefine((file, ctx) => {
  if (file.editable && file.editable.end > file.contents.split('\n').length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['editable'],
      message: `editable region ends at line ${file.editable.end} but "${file.name}" has fewer lines`,
    });
  }
});
export type SeedFile = z.infer<typeof SeedFileSchema>;

/** A file shown in a "Try it" playground. The whole file is editable. */
export const TryitFileSchema = SeedFileBase.omit({ editable: true });

/** An unnamed or named code listing shown read-only (concept `code`, predict/spotbug `code`, tapbuild `template`). */
export const CodeBlockSchema = z.object({
  lang: NonEmpty,
  name: FileNameSchema.optional(),
  contents: NonEmpty,
});
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

export const TryitSchema = z.object({
  runner: CodeRunnerSchema,
  files: z.array(TryitFileSchema).min(1),
});
export type Tryit = z.infer<typeof TryitSchema>;

/** One test: `text` is the message shown when it fails (HTML); `code` is the test body. */
export const TestSchema = z.object({ text: Html, code: NonEmpty });
export type TestCase = z.infer<typeof TestSchema>;

// ---------------------------------------------------------------------------
// Rules shared by steps, labs and typein screens

/** Counts `--editable-region--` ranges across files (each file holds at most one). */
export function countEditableRegions(files: readonly SeedFile[]): number {
  return files.filter((f) => f.editable).length;
}

/** Seed and solution must list the same file names. `add(field, message)` reports an issue. */
function checkSeedMatchesSolutions(
  seed: readonly SeedFile[],
  solutions: readonly SeedFile[],
  add: (field: 'seed' | 'solutions', message: string) => void,
) {
  const seedNames = seed.map((f) => f.name);
  const solutionNames = solutions.map((f) => f.name);
  const seedDupe = seedNames.find((n, i) => seedNames.indexOf(n) !== i);
  if (seedDupe) add('seed', `file "${seedDupe}" appears twice`);
  const solutionDupe = solutionNames.find((n, i) => solutionNames.indexOf(n) !== i);
  if (solutionDupe) add('solutions', `file "${solutionDupe}" appears twice`);
  const missingInSolutions = seedNames.filter((n) => !solutionNames.includes(n));
  const extraInSolutions = solutionNames.filter((n) => !seedNames.includes(n));
  if (missingInSolutions.length || extraInSolutions.length) {
    add(
      'solutions',
      `solutions and seed must contain the same files` +
        (missingInSolutions.length
          ? ` (missing in solutions: ${missingInSolutions.join(', ')})`
          : '') +
        (extraInSolutions.length ? ` (not in seed: ${extraInSolutions.join(', ')})` : ''),
    );
  }
  if (solutions.some((f) => f.editable)) {
    add('solutions', 'solutions must not contain --editable-region-- markers');
  }
}

// ---------------------------------------------------------------------------
// Workshop step (content/blocks/<slug>/NN.md)

export const StepSchema = z
  .object({
    id: IdSchema,
    /** 1-based, from the file name (01.md = 1). */
    step: z.number().int().min(1),
    title: NonEmpty,
    runner: CodeRunnerSchema,
    description: Html,
    tests: z.array(TestSchema).min(1, 'a step needs at least one test'),
    seed: z.array(SeedFileSchema).min(1, 'the seed needs at least one file'),
    solutions: z.array(SeedFileSchema).min(1, 'every step needs solutions'),
    /** 1 to 3 hints, from conceptual to the exact code. */
    help: z.array(Html).min(1, 'a step needs at least one hint').max(3, 'at most three hints'),
  })
  .superRefine((step, ctx) => {
    const regions = countEditableRegions(step.seed);
    if (regions !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seed'],
        message: `a step needs exactly one editable region, found ${regions}`,
      });
    }
    checkSeedMatchesSolutions(step.seed, step.solutions, (field, message) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message }),
    );
  });
export type Step = z.infer<typeof StepSchema>;

// ---------------------------------------------------------------------------
// Lab (content/blocks/<slug>/lab.md)

export const LabSchema = z
  .object({
    /** The block id (labs have no id of their own). */
    id: IdSchema,
    runner: CodeRunnerSchema,
    description: Html,
    userStories: z.array(Html).min(1, 'a lab needs at least one user story'),
    /** File in `solutions` that is rendered as the "example project". Copied from meta.json. */
    demo: NonEmpty.optional(),
    tests: z.array(TestSchema).min(1, 'a lab needs at least one test'),
    seed: z.array(SeedFileSchema).min(1),
    solutions: z.array(SeedFileSchema).min(1, 'every lab needs solutions'),
    help: z.array(Html).min(1, 'a lab needs at least one hint').max(3, 'at most three hints'),
  })
  .superRefine((lab, ctx) => {
    const regions = countEditableRegions(lab.seed);
    if (regions > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seed'],
        message: `a lab seed has at most one editable region, found ${regions}`,
      });
    }
    checkSeedMatchesSolutions(lab.seed, lab.solutions, (field, message) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message }),
    );
    if (lab.demo && !lab.solutions.some((f) => f.name === lab.demo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['demo'],
        message: `demo "${lab.demo}" is not a file in the solutions`,
      });
    }
  });
export type Lab = z.infer<typeof LabSchema>;

// ---------------------------------------------------------------------------
// Lesson screens (content/blocks/<slug>/lesson.md)

export const OptionSchema = z.object({
  html: Html,
  correct: z.boolean(),
  /** HTML. Shown when this option is picked (and for correct options, when the answer is revealed). */
  feedback: Html,
});
export type Option = z.infer<typeof OptionSchema>;

const OptionsSchema = z.array(OptionSchema).min(2, 'needs at least two options').max(6);

export const CALLOUT_KINDS = ['info', 'tip', 'warning'] as const;

export const ConceptScreenSchema = z.object({
  type: z.literal('concept'),
  body: Html,
  code: CodeBlockSchema.optional(),
  tryit: TryitSchema.optional(),
  callout: z.object({ kind: z.enum(CALLOUT_KINDS), html: Html }).optional(),
});

export const McqScreenSchema = z.object({
  type: z.literal('mcq'),
  question: Html,
  options: OptionsSchema,
  why: Html,
});

export const MultiScreenSchema = z.object({
  type: z.literal('multi'),
  question: Html,
  options: OptionsSchema,
  why: Html,
});

export const TapbuildScreenSchema = z.object({
  type: z.literal('tapbuild'),
  prompt: Html,
  template: CodeBlockSchema,
  /** Every token the learner can tap, distractors included. Duplicates are allowed. */
  tokens: z.array(NonEmpty).min(2),
  /** The tokens that fill the blanks, in order. */
  answer: z.array(NonEmpty).min(1),
  why: Html,
});

export const TypeinScreenSchema = z.object({
  type: z.literal('typein'),
  prompt: Html,
  seed: z.array(SeedFileSchema).min(1),
  solutions: z.array(SeedFileSchema).min(1, 'every typein screen needs solutions'),
  tests: z.array(TestSchema).min(1),
  why: Html,
});

export const PredictScreenSchema = z.object({
  type: z.literal('predict'),
  code: CodeBlockSchema,
  question: Html,
  options: OptionsSchema,
  why: Html,
});

export const SpotbugScreenSchema = z.object({
  type: z.literal('spotbug'),
  code: CodeBlockSchema,
  question: Html,
  options: OptionsSchema,
  why: Html,
});

export const OrderScreenSchema = z.object({
  type: z.literal('order'),
  prompt: Html,
  /** HTML, in the correct order. The player shuffles them. */
  items: z.array(Html).min(2),
  why: Html,
});

export const MatchScreenSchema = z.object({
  type: z.literal('match'),
  prompt: Html,
  pairs: z.array(z.object({ left: Html, right: Html })).min(2),
  why: Html,
});

export const WidgetScreenSchema = z.object({
  type: z.literal('widget'),
  /** Kebab-case name of a React widget registered by the lesson player. */
  name: z.string().regex(SLUG_RE, 'widget names are kebab-case, e.g. "escalation-slider"'),
  props: z.record(z.unknown()),
  prompt: Html.optional(),
  why: Html.optional(),
});

export const FlashcardScreenSchema = z.object({
  type: z.literal('flashcard'),
  question: Html,
  answer: Html,
});

export const ChecklistItemSchema = z.object({
  html: Html,
  /** The learner runs `command`, pastes the output, and it must match `pattern`. */
  check: z
    .object({
      command: NonEmpty,
      pattern: NonEmpty,
      hint: NonEmpty,
    })
    .optional(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ChecklistScreenSchema = z.object({
  type: z.literal('checklist'),
  items: z.array(ChecklistItemSchema).min(1),
});

export const ScreenSchema = z.discriminatedUnion('type', [
  ConceptScreenSchema,
  McqScreenSchema,
  MultiScreenSchema,
  TapbuildScreenSchema,
  TypeinScreenSchema,
  PredictScreenSchema,
  SpotbugScreenSchema,
  OrderScreenSchema,
  MatchScreenSchema,
  WidgetScreenSchema,
  FlashcardScreenSchema,
  ChecklistScreenSchema,
]);
export type Screen = z.infer<typeof ScreenSchema>;
export type ScreenType = Screen['type'];
export const SCREEN_TYPES = [
  'concept',
  'mcq',
  'multi',
  'tapbuild',
  'typein',
  'predict',
  'spotbug',
  'order',
  'match',
  'widget',
  'flashcard',
  'checklist',
] as const satisfies readonly ScreenType[];

export type McqScreen = z.infer<typeof McqScreenSchema>;
export type TapbuildScreen = z.infer<typeof TapbuildScreenSchema>;
export type TypeinScreen = z.infer<typeof TypeinScreenSchema>;

/** A blank in a tapbuild template: exactly three underscores. */
export const BLANK = '___';
export function countBlanks(template: string): number {
  return (template.match(/___/g) ?? []).length;
}

/** Per-screen rules that zod's discriminated union cannot carry. */
export function refineScreen(screen: Screen, ctx: z.RefinementCtx, path: (string | number)[]) {
  const add = (sub: string, message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path, sub], message });

  switch (screen.type) {
    case 'mcq':
    case 'predict':
    case 'spotbug': {
      const n = screen.options.filter((o) => o.correct).length;
      if (n !== 1)
        add('options', `${screen.type} needs exactly one correct option ([x]), found ${n}`);
      break;
    }
    case 'multi': {
      const n = screen.options.filter((o) => o.correct).length;
      if (n < 1) add('options', 'multi needs at least one correct option ([x])');
      break;
    }
    case 'tapbuild': {
      const blanks = countBlanks(screen.template.contents);
      if (/_{4,}/.test(screen.template.contents)) {
        add(
          'template',
          'a blank is exactly three underscores (___); found a longer run of underscores',
        );
      }
      if (blanks !== screen.answer.length) {
        add(
          'answer',
          `template has ${blanks} blank${blanks === 1 ? '' : 's'} but the answer has ${screen.answer.length} token${screen.answer.length === 1 ? '' : 's'}`,
        );
      }
      const pool = new Map<string, number>();
      for (const t of screen.tokens) pool.set(t, (pool.get(t) ?? 0) + 1);
      for (const t of screen.answer) {
        const left = pool.get(t) ?? 0;
        if (left === 0) {
          add(
            'answer',
            `answer token "${t}" is not in the token list (or is used more times than it is listed)`,
          );
          break;
        }
        pool.set(t, left - 1);
      }
      break;
    }
    case 'typein': {
      const regions = countEditableRegions(screen.seed);
      if (regions !== 1)
        add('seed', `a typein screen needs exactly one editable region, found ${regions}`);
      checkSeedMatchesSolutions(screen.seed, screen.solutions, add);
      break;
    }
    case 'order': {
      if (new Set(screen.items).size !== screen.items.length)
        add('items', 'order items must all be different');
      break;
    }
    case 'match': {
      const rights = screen.pairs.map((p) => p.right);
      if (new Set(rights).size !== rights.length)
        add('pairs', 'the right-hand side of each pair must be different');
      break;
    }
    case 'checklist': {
      screen.items.forEach((item, i) => {
        if (!item.check) return;
        try {
          new RegExp(item.check.pattern);
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, 'items', i, 'check'],
            message: `pattern is not a valid regular expression: ${(e as Error).message}`,
          });
        }
      });
      break;
    }
    default:
      break;
  }
}

export const LessonSchema = z
  .object({
    /** The block id. */
    id: IdSchema,
    screens: z.array(ScreenSchema).min(1, 'a lesson needs at least one screen'),
  })
  .superRefine((lesson, ctx) => {
    lesson.screens.forEach((screen, i) => refineScreen(screen, ctx, ['screens', i]));
  });
export type Lesson = z.infer<typeof LessonSchema>;

// ---------------------------------------------------------------------------
// Quiz and exam (content/blocks/<slug>/quiz.md)

export const QuizQuestionSchema = z.object({
  /** Stable 8-char hash of the question text (see questionId in ids.ts). */
  id: IdSchema,
  text: Html,
  distractors: z.array(Html).min(2, 'needs at least two distractors').max(5),
  answer: Html,
  explanation: Html,
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z
  .object({
    /** The block id. */
    id: IdSchema,
    /** Questions drawn per attempt. */
    draw: z.number().int().min(1),
    /** Correct answers needed to pass. */
    pass: z.number().int().min(1),
    questions: z.array(QuizQuestionSchema).min(1),
  })
  .superRefine((quiz, ctx) => {
    if (quiz.pass > quiz.draw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pass'],
        message: `pass (${quiz.pass}) must not be more than draw (${quiz.draw})`,
      });
    }
    if (quiz.draw > quiz.questions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['draw'],
        message: `draw (${quiz.draw}) must not be more than the number of questions (${quiz.questions.length})`,
      });
    }
  });
export type Quiz = z.infer<typeof QuizSchema>;

// ---------------------------------------------------------------------------
// Review (content/blocks/<slug>/review.md)

export const ReviewSegmentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('html'), html: Html }),
  z.object({ type: z.literal('tryit'), tryit: TryitSchema }),
]);
export type ReviewSegment = z.infer<typeof ReviewSegmentSchema>;

export const ReviewSchema = z.object({
  /** The block id. */
  id: IdSchema,
  /** HTML and "Try it" snippets in reading order. */
  body: z.array(ReviewSegmentSchema).min(1),
});
export type Review = z.infer<typeof ReviewSchema>;

// ---------------------------------------------------------------------------
// Project (content/blocks/<slug>/project.md)

export const ProjectSchema = z.object({
  /** The block id. */
  id: IdSchema,
  /** Name of the GitHub Actions job that must be green, e.g. "lab-setup". */
  ciJob: z.string().regex(/^lab-[a-z0-9-]+$/, 'must look like "lab-setup"'),
  userStories: z.array(Html).min(1, 'a project needs at least one user story'),
  instructions: Html,
});
export type Project = z.infer<typeof ProjectSchema>;

// ---------------------------------------------------------------------------
// Built output (public/content)

const RoomCode = z.string().regex(/^[A-Z]\d+-\d{2,}$/);

export const BlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('lesson'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    lesson: LessonSchema,
  }),
  z.object({
    type: z.literal('workshop'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    steps: z.array(StepSchema).min(1),
  }),
  z.object({ type: z.literal('lab'), meta: BlockMetaSchema, roomCode: RoomCode, lab: LabSchema }),
  z.object({
    type: z.literal('review'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    review: ReviewSchema,
  }),
  z.object({
    type: z.literal('quiz'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    quiz: QuizSchema,
  }),
  z.object({
    type: z.literal('exam'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    quiz: QuizSchema,
  }),
  z.object({
    type: z.literal('project'),
    meta: BlockMetaSchema,
    roomCode: RoomCode,
    project: ProjectSchema,
  }),
]);
/** What `public/content/blocks/<slug>.json` holds. */
export type Block = z.infer<typeof BlockSchema>;

export const BlockSummarySchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  type: BlockTypeSchema,
  title: NonEmpty,
  runner: RunnerSchema,
  estMinutes: z.number().int().positive(),
  /** Screens (lesson), steps (workshop), user stories (lab, project), draw (quiz, exam), 1 (review). */
  itemCount: z.number().int().min(1),
  /** Chapter id + "-" + 2-digit position in the chapter, e.g. "B1-04". */
  roomCode: RoomCode,
  optional: z.boolean().optional(),
  /** Workshops only: the step ids in order, so the map and home need not load every workshop. */
  stepIds: z.array(IdSchema).min(1).optional(),
});
export type BlockSummary = z.infer<typeof BlockSummarySchema>;

/** What `public/content/curriculum.json` holds. */
export const CurriculumIndexSchema = z.object({
  tracks: z.array(
    z.object({
      id: TrackIdSchema,
      title: NonEmpty,
      fixture: z.boolean().optional(),
      chapters: z.array(
        z.object({
          id: ChapterSchema.shape.id,
          title: NonEmpty,
          blocks: z.array(BlockSummarySchema),
        }),
      ),
    }),
  ),
});
export type CurriculumIndex = z.infer<typeof CurriculumIndexSchema>;
