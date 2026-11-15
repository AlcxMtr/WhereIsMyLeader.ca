const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/** Escapes the text, then supports `**bold**`, `*italic*` and newlines. */
export function markdownToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Turns `[n]` markers into links to the n-th (1-based) citation. Markers without a usable URL are left as text. */
export function withLinkedCitations(html: string, citations: string[], linkClassName: string): string {
  if (!citations.length) return html;

  return html.replace(/\[(\d+)\]/g, (match, rawIndex) => {
    const citationNumber = Number(rawIndex);
    if (!Number.isFinite(citationNumber) || citationNumber < 1 || citationNumber > citations.length) {
      return match;
    }

    const href = citations[citationNumber - 1];
    if (!href || !isSafeHttpUrl(href)) return match;

    return `<sup><a class="${linkClassName}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">[${citationNumber}]</a></sup>`;
  });
}
