import { describe, expect, it } from 'vitest';
import {
  formatBuildContext,
  formatFeedContext,
  formatVehicleLabel,
} from './aiContext';

describe('aiContext', () => {
  it('formats vehicle label', () => {
    expect(formatVehicleLabel({ year: 2026, make: 'AUDI', model: 'S5' })).toBe(
      '2026 AUDI S5'
    );
    expect(formatVehicleLabel(null)).toBe('No vehicle selected');
  });

  it('formats empty and populated build context', () => {
    expect(formatBuildContext([], 0)).toContain('no parts yet');
    const filled = formatBuildContext(
      [
        {
          category: 'Suspension',
          partName: 'Coilovers',
          brand: 'KW',
          price: 1200,
          status: 'planned',
        },
      ],
      1200
    );
    expect(filled).toContain('[Suspension] KW Coilovers');
    expect(filled).toContain('$1200');
  });

  it('formats feed context', () => {
    expect(formatFeedContext([])).toContain('No recent Feed posts');
    expect(
      formatFeedContext([{ caption: 'New wheels day', createdAt: '2026-07-18T00:00:00Z' }])
    ).toContain('New wheels day');
  });
});
