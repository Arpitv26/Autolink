export type AiBuildItemSummary = {
  category: string;
  partName: string;
  brand: string;
  price: number;
  status: string;
};

export type AiPostSummary = {
  caption: string;
  createdAt: string;
};

export function formatVehicleLabel(input: {
  year: number;
  make: string;
  model: string;
} | null): string {
  if (!input) return 'No vehicle selected';
  return `${input.year} ${input.make} ${input.model}`;
}

export function formatBuildContext(
  items: AiBuildItemSummary[],
  totalCost: number
): string {
  if (items.length === 0) {
    return 'Active Mod Planner build has no parts yet. Recommend starter mods carefully and suggest adding chosen parts to Planner.';
  }

  const lines = items.map((item) => {
    const price =
      Number.isFinite(item.price) && item.price > 0
        ? `$${item.price.toFixed(0)}`
        : 'price n/a';
    return `- [${item.category}] ${item.brand} ${item.partName} (${item.status}, ${price})`;
  });

  return [
    `Active Mod Planner build currently includes ${items.length} part(s). Estimated total: $${Math.max(0, totalCost).toFixed(0)}.`,
    'Parts on the build (treat planned/ordered/installed as the user\'s current plan unless they say otherwise):',
    ...lines,
  ].join('\n');
}

export function formatFeedContext(posts: AiPostSummary[]): string {
  if (posts.length === 0) {
    return 'No recent Feed posts linked to this vehicle.';
  }

  const lines = posts.map((post, index) => {
    const caption = post.caption.trim() || '(no caption)';
    const date = post.createdAt.slice(0, 10);
    return `- Post ${index + 1} (${date}): ${caption}`;
  });

  return [
    `Recent Feed posts about this vehicle (${posts.length}):`,
    ...lines,
  ].join('\n');
}
