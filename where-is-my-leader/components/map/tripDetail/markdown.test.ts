import { describe, expect, it } from 'vitest';

import { markdownToHtml, withLinkedCitations } from './markdown';

describe('markdownToHtml', () => {
  it('escapes HTML before applying formatting', () => {
    expect(markdownToHtml('<script>alert(1)</script> **bold**')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt; <strong>bold</strong>'
    );
  });

  it('turns newlines into line breaks', () => {
    expect(markdownToHtml('a\nb')).toBe('a<br>b');
  });
});

describe('withLinkedCitations', () => {
  const citations = ['https://example.com/a', 'javascript:alert(1)', 'https://example.com/"onmouseover="x'];

  it('links markers to their citation', () => {
    const html = withLinkedCitations('See [1].', citations, 'cite');
    expect(html).toContain('<a class="cite" href="https://example.com/a"');
    expect(html).toContain('[1]</a>');
  });

  it('leaves markers alone when the citation is missing or not an http(s) URL', () => {
    expect(withLinkedCitations('[2] [9]', citations, 'cite')).toBe('[2] [9]');
  });

  it('escapes quotes in the URL so it cannot break out of the attribute', () => {
    const html = withLinkedCitations('[3]', citations, 'cite');
    expect(html).not.toContain('"onmouseover=');
  });
});
