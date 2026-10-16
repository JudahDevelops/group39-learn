// jsdom ships no types and @types/jsdom is not installed. This is only what runner.helpers.ts uses.
declare module 'jsdom' {
  export class VirtualConsole {}
  export class JSDOM {
    constructor(
      html?: string,
      options?: {
        runScripts?: 'dangerously' | 'outside-only';
        pretendToBeVisual?: boolean;
        virtualConsole?: VirtualConsole;
        beforeParse?: (window: Window & typeof globalThis) => void;
      },
    );
    readonly window: Window & typeof globalThis;
  }
}
