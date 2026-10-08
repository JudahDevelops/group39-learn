/** npm run validate:content: parse and check everything under content/. Exits 1 with file:line messages. */
import { formatIssues, loadContent } from '../src/content/validate';
import { readContentDir } from './lib/disk';

const result = loadContent(readContentDir());

if (result.issues.length > 0) {
  console.error(formatIssues(result.issues));
  console.error(
    `\n${result.issues.length} problem${result.issues.length === 1 ? '' : 's'} found in content/.`,
  );
  process.exit(1);
}

const counts = new Map<string, number>();
let steps = 0;
let questions = 0;
for (const block of result.blocks.values()) {
  counts.set(block.type, (counts.get(block.type) ?? 0) + 1);
  if (block.type === 'workshop') steps += block.steps.length;
  if (block.type === 'quiz' || block.type === 'exam') questions += block.quiz.questions.length;
}
const summary = [...counts].map(([type, n]) => `${n} ${type}`).join(', ');
console.log(
  `content ok: ${result.blocks.size} blocks (${summary}), ${steps} steps, ${questions} quiz questions`,
);
