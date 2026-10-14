import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '../../src/content/markdown';

describe('markdownToHtml figures', () => {
  it('wraps an image in a link that opens it full size', () => {
    const html = markdownToHtml('![Figure 3.2: Architecture](/img/paper/fig-architecture.webp)');
    expect(html).toContain(
      '<a href="/img/paper/fig-architecture.webp" target="_blank" rel="noopener" class="figure-link"',
    );
    expect(html).toContain('<img src="/img/paper/fig-architecture.webp" alt="Figure 3.2: Architecture">');
  });

  it('leaves an image that is already a link alone', () => {
    const html = markdownToHtml('[![logo](/a.png)](/home)');
    expect(html).toBe('<p><a href="/home"><img src="/a.png" alt="logo"></a></p>');
  });
});
