/**
 * Loop protection. A learner's `while (true) {}` would freeze the page, because a sandboxed frame
 * may share its thread with the app and a script cannot be interrupted from outside. So before
 * the learner's JavaScript runs, every `while`, `do` and `for (;;)` loop gets a call at the start
 * of its body that stops the script once one run of the loop has gone on for too long
 * (`LOOP_GUARD_JS` in bridge.ts defines the call).
 *
 * The edit only inserts text on the same line, so line numbers in error messages stay right.
 * Code that does not parse is left alone, so a syntax error is reported as the learner wrote it.
 */
import { javascriptLanguage } from '@codemirror/lang-javascript';

type SyntaxNode = ReturnType<typeof javascriptLanguage.parser.parse>['topNode'];

/** The name of the global the inserted calls use. */
export const LOOP_GUARD = '__g39lp';

function realChildren(node: SyntaxNode): SyntaxNode[] {
  const kids: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (!/Comment$/.test(child.name)) kids.push(child);
  }
  return kids;
}

/** The statement a loop repeats, or null for a loop this does not guard (for...of and for...in end by themselves). */
function loopBody(loop: SyntaxNode): SyntaxNode | null {
  const kids = realChildren(loop);
  if (loop.name === 'DoStatement') return kids[1] ?? null;
  if (loop.name === 'ForStatement' && kids[1]?.name !== 'ForSpec') return null;
  return kids[kids.length - 1] ?? null;
}

/**
 * `scope` names the script ("script.js", "index.html#2") so loops in different scripts are told
 * apart.
 */
export function protectLoops(source: string, scope: string): string {
  if (!/\b(?:while|for|do)\b/.test(source)) return source;
  const tree = javascriptLanguage.parser.parse(source);

  let broken = false;
  const loops: SyntaxNode[] = [];
  tree.iterate({
    enter(ref) {
      if (ref.type.isError) {
        broken = true;
        return false;
      }
      if (
        ref.name === 'WhileStatement' ||
        ref.name === 'DoStatement' ||
        ref.name === 'ForStatement'
      ) {
        loops.push(ref.node);
      }
      return undefined;
    },
  });
  if (broken) return source;

  const edits: { at: number; text: string }[] = [];
  loops.forEach((loop, index) => {
    const body = loopBody(loop);
    if (!body) return;
    const call = `${LOOP_GUARD}(${JSON.stringify(`${scope}:${index}`)});`;
    if (body.name === 'Block') {
      edits.push({ at: body.from + 1, text: call });
    } else {
      // A loop with no braces: give it some, so the call has a place to go.
      edits.push({ at: body.from, text: `{${call}` }, { at: body.to, text: '}' });
    }
  });

  let result = source;
  for (const { at, text } of edits.sort((a, b) => b.at - a.at)) {
    result = result.slice(0, at) + text + result.slice(at);
  }
  return result;
}
