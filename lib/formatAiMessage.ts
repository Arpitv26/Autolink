/**
 * Turns model markdown into clean chat copy (no raw # / ** clutter).
 */
export function formatAiMessageForDisplay(text: string): string {
  let next = text.replace(/\r\n/g, '\n').trim();

  // Fenced code blocks → plain content
  next = next.replace(/```[\w]*\n?([\s\S]*?)```/g, (_match, code: string) =>
    code.trim()
  );

  // Headings
  next = next.replace(/^#{1,6}\s+/gm, '');

  // Bold / italic markers (order matters: ** before *)
  next = next.replace(/\*\*(.+?)\*\*/g, '$1');
  next = next.replace(/__(.+?)__/g, '$1');
  next = next.replace(/\*(.+?)\*/g, '$1');
  next = next.replace(/_(.+?)_/g, '$1');

  // Inline code
  next = next.replace(/`([^`]+)`/g, '$1');

  // Links [label](url) → label
  next = next.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // List markers
  next = next.replace(/^\s*[-*+]\s+/gm, '• ');

  // Horizontal rules
  next = next.replace(/^\s*([-*_]){3,}\s*$/gm, '');

  // Collapse extra blank lines
  next = next.replace(/\n{3,}/g, '\n\n');

  return next.trim();
}
