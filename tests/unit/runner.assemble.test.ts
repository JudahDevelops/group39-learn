import { describe, expect, it } from 'vitest';
import {
  buildPreviewDocument,
  codeForTests,
  entryFile,
  escapeScriptText,
  fillTemplate,
  injectAtHeadStart,
  jsonForScript,
  locateScriptLine,
  normalizeName,
  usesScript,
} from '../../src/runners/web/assemble';

const html = (head: string, body: string) =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>`;

describe('buildPreviewDocument: styles', () => {
  it('replaces the matching link with a style element', () => {
    const doc = buildPreviewDocument({
      'index.html': html('<link rel="stylesheet" href="styles.css" />', '<h1>Hi</h1>'),
      'styles.css': 'h1 { color: red; }',
    });
    expect(doc).toContain('<style>h1 { color: red; }</style>');
    expect(doc).not.toContain('<link');
  });

  it('matches ./styles.css and single quotes', () => {
    const doc = buildPreviewDocument({
      'index.html': html("<link href='./styles.css' rel='stylesheet'>", ''),
      'styles.css': 'p {}',
    });
    expect(doc).toContain('<style>p {}</style>');
    expect(doc).not.toContain('<link');
  });

  it('leaves links to other files alone and appends the unreferenced file to the head', () => {
    const doc = buildPreviewDocument({
      'index.html': html('<link rel="stylesheet" href="https://example.com/x.css" />', ''),
      'styles.css': 'p {}',
    });
    expect(doc).toContain('href="https://example.com/x.css"');
    expect(doc.indexOf('<style>p {}</style>')).toBeLessThan(doc.indexOf('</head>'));
    expect(doc.indexOf('<style>p {}</style>')).toBeGreaterThan(doc.indexOf('<head>'));
  });

  it('ignores a link inside an HTML comment and appends the style instead', () => {
    const doc = buildPreviewDocument({
      'index.html': html('<!-- <link rel="stylesheet" href="styles.css"> -->', ''),
      'styles.css': 'p {}',
    });
    expect(doc).toContain('<!-- <link rel="stylesheet" href="styles.css"> -->');
    expect(doc).toContain('<style>p {}</style>');
  });

  it('does not let CSS end its own style element', () => {
    const doc = buildPreviewDocument({
      'index.html': html('', ''),
      'styles.css': '/* </style><b>x</b> */',
    });
    expect(doc).not.toContain('</style><b>');
  });
});

describe('buildPreviewDocument: scripts', () => {
  it('replaces the matching script tag in place, dropping src', () => {
    const doc = buildPreviewDocument({
      'index.html': html('', '<p>a</p>\n<script src="script.js"></script>'),
      'script.js': 'var a = 1;',
    });
    expect(doc).toMatch(/<script>\/\*g39:script\.js\*\/var a = 1;<\/script>/);
    expect(doc).not.toContain('src=');
  });

  it('keeps type="module" and moves a deferred script to the end of the body', () => {
    const mod = buildPreviewDocument({
      'index.html': html('<script type="module" src="script.js"></script>', ''),
      'script.js': 'export {};',
    });
    expect(mod).toContain('<script type="module">');

    const deferred = buildPreviewDocument({
      'index.html': html('<script src="script.js" defer></script>', '<h1>x</h1>'),
      'script.js': 'var a = 1;',
    });
    const at = deferred.indexOf('var a = 1;');
    expect(at).toBeGreaterThan(deferred.indexOf('<h1>x</h1>'));
    expect(at).toBeLessThan(deferred.indexOf('</body>'));
    expect(deferred).not.toContain('defer');
  });

  it('appends an unreferenced script before the closing body tag', () => {
    const doc = buildPreviewDocument({
      'index.html': html('', '<h1>x</h1>'),
      'script.js': 'var a = 1;',
    });
    expect(doc.indexOf('var a = 1;')).toBeGreaterThan(doc.indexOf('<h1>x</h1>'));
    expect(doc.indexOf('var a = 1;')).toBeLessThan(doc.indexOf('</body>'));
  });

  it('escapes </script> and <!-- inside the learner script', () => {
    const doc = buildPreviewDocument({
      'index.html': html('', ''),
      'script.js': 'var s = "</script><b>"; var c = "<!--";',
    });
    expect(doc).not.toContain('</script><b>');
    expect(doc).not.toContain('"<!--"');
    expect(escapeScriptText('</SCRIPT>')).toBe('<\\/SCRIPT>');
  });

  it('is not fooled by $ patterns in the learner code', () => {
    const doc = buildPreviewDocument({
      'index.html': html('<script src="script.js"></script>', ''),
      'script.js': 'var price = \'$&\' + "$1";',
    });
    expect(doc).toContain("'$&'");
    expect(doc).toContain('"$1"');
  });
});

describe('buildPreviewDocument: the page itself', () => {
  it('picks index.html, else the first html file, else an empty page', () => {
    expect(entryFile({ 'a.html': 'a', 'index.html': 'i' })).toBe('index.html');
    expect(entryFile({ 'a.html': 'a', 'b.html': 'b' })).toBe('a.html');
    expect(entryFile({ 'script.js': 'x' })).toBeNull();
    expect(entryFile({ 'a.html': 'a', 'b.html': 'b' }, 'b.html')).toBe('b.html');
  });

  it('builds a page from a script alone', () => {
    const doc = buildPreviewDocument({ 'script.js': 'console.log(1);' });
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('console.log(1);');
  });

  it('opens the demo entry when asked', () => {
    const doc = buildPreviewDocument(
      { 'index.html': '<p>home</p>', 'about.html': '<p>about</p>' },
      { entry: 'about.html' },
    );
    expect(doc).toContain('about');
    expect(doc).not.toContain('home');
  });

  it('puts injected code first in the head and keeps the doctype first', () => {
    const doc = buildPreviewDocument(
      { 'index.html': html('<title>t</title>', '') },
      { inject: '<script>1</script>' },
    );
    expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(doc.indexOf('<script>1</script>')).toBeLessThan(doc.indexOf('<title>'));
    expect(doc.indexOf('<script>1</script>')).toBeGreaterThan(doc.indexOf('<head>'));
  });

  it('injectAtHeadStart falls back through html, doctype and the start', () => {
    expect(injectAtHeadStart('<html><body></body></html>', 'X')).toBe(
      '<html>X<body></body></html>',
    );
    expect(injectAtHeadStart('<!DOCTYPE html><p>a</p>', 'X')).toBe('<!DOCTYPE html>X<p>a</p>');
    expect(injectAtHeadStart('<p>a</p>', 'X')).toBe('X<p>a</p>');
  });
});

describe('helpers', () => {
  it('normalizeName strips ./ and /', () => {
    expect(normalizeName('./a/b.css')).toBe('a/b.css');
    expect(normalizeName('/a.css')).toBe('a.css');
  });

  it('codeForTests is the page, or every file joined', () => {
    expect(codeForTests({ 'index.html': '<p>i</p>', 'styles.css': 'p{}' })).toBe('<p>i</p>');
    expect(codeForTests({ 'a.js': 'A', 'b.js': 'B' })).toBe('A\nB');
  });

  it('usesScript sees script files and script elements', () => {
    expect(usesScript({ 'index.html': '<p>hi</p>', 'styles.css': 'p{}' })).toBe(false);
    expect(usesScript({ 'index.html': '<p>hi</p>', 'script.js': '' })).toBe(false);
    expect(usesScript({ 'index.html': '<p>hi</p>', 'script.js': 'x()' })).toBe(true);
    expect(usesScript({ 'index.html': '<SCRIPT>x()</SCRIPT>' })).toBe(true);
  });

  it('jsonForScript is safe inside a script element', () => {
    const text = jsonForScript({ a: '</script><!--', b: ' ' });
    expect(text).not.toContain('<');
    expect(text).not.toContain(' ');
    expect(JSON.parse(text)).toEqual({ a: '</script><!--', b: ' ' });
  });

  it('fillTemplate fills once, so inserted text is never read as a placeholder', () => {
    expect(fillTemplate('a __X__ b __Y__', { X: '__Y__', Y: 'y' })).toBe('a __Y__ b y');
    expect(fillTemplate('__UNKNOWN__', {})).toBe('__UNKNOWN__');
  });

  it('locateScriptLine maps a page line to a file line, and gives up outside inlined scripts', () => {
    const doc = buildPreviewDocument({
      'index.html': html('<script src="script.js"></script>', '<p>x</p>'),
      'script.js': 'one();\ntwo();\nthree();',
    });
    const marker = doc.split('\n').findIndex((l) => l.includes('g39:script.js')) + 1;
    expect(locateScriptLine(doc, marker)).toEqual({ file: 'script.js', line: 1 });
    expect(locateScriptLine(doc, marker + 2)).toEqual({ file: 'script.js', line: 3 });
    expect(locateScriptLine(doc, marker + 6)).toBeNull();
    expect(locateScriptLine(doc, 1)).toBeNull();
  });
});
