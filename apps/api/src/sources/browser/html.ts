export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function paragraphs(parts: Array<string | null | undefined>): string {
  return parts
    .filter(
      (part): part is string =>
        typeof part === 'string' && part.trim().length > 0,
    )
    .map((part) => `<p>${escapeHtml(part.trim())}</p>`)
    .join('');
}

export function markdownToText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~]+/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]*[-+][ \t]+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
