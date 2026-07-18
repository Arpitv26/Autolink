import catalog from '../data/parts_catalog.json';

export type CatalogPart = {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  description: string;
};

export type PartsCatalogFilters = {
  category?: string | null;
  brand?: string | null;
  maxPrice?: number | null;
  query?: string | null;
};

const PARTS: CatalogPart[] = catalog.parts.map((part) => ({
  id: part.id,
  category: part.category,
  brand: part.brand,
  name: part.name,
  price: part.price,
  description: part.description,
}));

export function getAllCatalogParts(): CatalogPart[] {
  return PARTS;
}

export function getCatalogCategories(): string[] {
  return [...new Set(PARTS.map((part) => part.category))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getCatalogBrands(category?: string | null): string[] {
  const scoped = category
    ? PARTS.filter((part) => part.category === category)
    : PARTS;
  return [...new Set(scoped.map((part) => part.brand))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getCatalogPartById(partId: string): CatalogPart | null {
  return PARTS.find((part) => part.id === partId) ?? null;
}

export function filterCatalogParts(
  filters: PartsCatalogFilters = {}
): CatalogPart[] {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const maxPrice =
    typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice)
      ? filters.maxPrice
      : null;

  return PARTS.filter((part) => {
    if (filters.category && part.category !== filters.category) return false;
    if (filters.brand && part.brand !== filters.brand) return false;
    if (maxPrice !== null && part.price > maxPrice) return false;
    if (!query) return true;

    const haystack = `${part.brand} ${part.name} ${part.category} ${part.description}`
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
