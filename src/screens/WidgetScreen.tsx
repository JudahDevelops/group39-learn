import { Component, type ReactNode } from 'react';
import { Html } from './Html';
import { Question } from './Question';
import { getWidget, isScored } from './widgets';
import type { ScreenOf } from './types';

export const WIDGET_MISSING_TEXT = 'This interactive part is not available yet.';
export const WIDGET_FAILED_TEXT = 'This interactive part could not load.';

class WidgetBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? <p className="notice">{WIDGET_FAILED_TEXT}</p> : this.props.children;
  }
}

/** Renders a registered widget, or says it is not available yet. The player decides what Continue does. */
export function WidgetScreen({
  screen,
  attempt,
  onResult,
}: {
  screen: ScreenOf<'widget'>;
  /** Changes on "Try again", so the widget starts fresh. */
  attempt: number;
  onResult: (correct?: boolean, note?: string) => void;
}) {
  const Widget = getWidget(screen.name);
  if (!Widget) {
    return (
      <div className="screen">
        <p className="notice">{WIDGET_MISSING_TEXT}</p>
      </div>
    );
  }
  return (
    <div className="screen">
      {screen.prompt && <Question html={screen.prompt} />}
      <WidgetBoundary key={attempt} onFail={() => onResult()}>
        <Widget props={screen.props} onResult={onResult} />
      </WidgetBoundary>
      {!isScored(screen.name, screen.props) && screen.why && (
        <Html html={screen.why} className="reading" />
      )}
    </div>
  );
}
