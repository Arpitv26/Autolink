import { describe, expect, it } from 'vitest';
import {
  filterCatalogParts,
  getAllCatalogParts,
  getCatalogBrands,
  getCatalogCategories,
  getCatalogPartById,
} from './partsCatalog';

describe('partsCatalog', () => {
  it('loads a full mocked catalog', () => {
    expect(getAllCatalogParts().length).toBeGreaterThanOrEqual(100);
    expect(getCatalogCategories()).toContain('Suspension');
  });

  it('filters by category, brand, and max price', () => {
    const filtered = filterCatalogParts({
      category: 'Brakes',
      brand: 'Hawk',
      maxPrice: 250,
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((part) => part.category === 'Brakes')).toBe(true);
    expect(filtered.every((part) => part.brand === 'Hawk')).toBe(true);
    expect(filtered.every((part) => part.price <= 250)).toBe(true);
  });

  it('supports text search and brand scoping', () => {
    const coiloverHits = filterCatalogParts({ query: 'coilover' });
    expect(coiloverHits.some((part) => /coilover/i.test(part.name))).toBe(true);

    const suspensionBrands = getCatalogBrands('Suspension');
    expect(suspensionBrands.length).toBeGreaterThan(0);
    expect(getCatalogPartById(coiloverHits[0].id)?.id).toBe(coiloverHits[0].id);
  });
});
