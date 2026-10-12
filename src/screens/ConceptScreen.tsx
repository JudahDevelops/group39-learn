import { Tryit } from '../editor/Tryit';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { Html } from './Html';
import type { ScreenOf } from './types';

/** Reading only: the body, then the code, the "Try it" playground and the callout, when they exist. */
export function ConceptScreen({ screen }: { screen: ScreenOf<'concept'> }) {
  return (
    <div className="screen">
      <Html html={screen.body} className="reading" />
      {screen.code && <CodeBlock contents={screen.code.contents} name={screen.code.name} />}
      {screen.tryit && <Tryit tryit={screen.tryit} />}
      {screen.callout && <Callout kind={screen.callout.kind} html={screen.callout.html} />}
    </div>
  );
}
