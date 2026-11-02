import { marked } from 'marked';

// Escape any raw HTML in the source so only markdown formatting is rendered.
marked.use({
  renderer: {
    html: ({ text }) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  },
});

export function renderMarkdown(src: string): string {
  if (!src.trim()) return '';
  return marked.parse(src, { async: false, breaks: true }) as string;
}
