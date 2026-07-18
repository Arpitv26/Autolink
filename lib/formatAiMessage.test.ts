import { describe, expect, it } from 'vitest';
import { formatAiMessageForDisplay } from './formatAiMessage';

describe('formatAiMessageForDisplay', () => {
  it('strips markdown clutter while keeping content', () => {
    const input = `### Wheel Options
**Brand:** Enkei
- Budget: $400
- Mid-range: $800`;

    const output = formatAiMessageForDisplay(input);
    expect(output).not.toContain('###');
    expect(output).not.toContain('**');
    expect(output).toContain('Wheel Options');
    expect(output).toContain('Brand: Enkei');
    expect(output).toContain('• Budget: $400');
  });
});
