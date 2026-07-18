import type { User } from '@supabase/supabase-js';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import type { CatalogPart } from '../lib/partsCatalog';
import { supabase } from '../lib/supabase';
import type { BuildItem, BuildSummary } from '../types/planner';

type BuildRow = {
  id: string;
  user_id: string;
  vehicle_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_active: boolean;
  total_cost: number | string;
  created_at: string;
  updated_at: string;
};

type BuildItemRow = {
  id: string;
  build_id: string;
  catalog_part_id: string;
  category: string;
  part_name: string;
  brand: string;
  price: number | string;
  notes: string | null;
  sort_order: number;
  position_x: number;
  position_y: number;
  status: 'planned' | 'ordered' | 'installed';
  created_at: string;
};

type UseBuildPlannerResult = {
  build: BuildSummary | null;
  items: BuildItem[];
  itemsByCategory: Record<string, BuildItem[]>;
  totalCost: number;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addPart: (part: CatalogPart) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  moveItem: (
    itemId: string,
    nextCategory: string,
    nextSortOrder: number
  ) => Promise<void>;
  swapItemOrder: (firstItemId: string, secondItemId: string) => Promise<void>;
  buildShareCaption: () => string;
};

function mapBuild(row: BuildRow): BuildSummary {
  return {
    id: row.id,
    userId: row.user_id,
    vehicleId: row.vehicle_id,
    title: row.title,
    description: row.description ?? '',
    isPublic: row.is_public,
    isActive: row.is_active,
    totalCost: Number(row.total_cost) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: BuildItemRow): BuildItem {
  return {
    id: row.id,
    buildId: row.build_id,
    catalogPartId: row.catalog_part_id,
    category: row.category,
    partName: row.part_name,
    brand: row.brand,
    price: Number(row.price) || 0,
    notes: row.notes ?? '',
    sortOrder: row.sort_order,
    positionX: row.position_x,
    positionY: row.position_y,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function useBuildPlanner(
  user: User | null,
  vehicleId: string | null
): UseBuildPlannerResult {
  const [build, setBuild] = useState<BuildSummary | null>(null);
  const [items, setItems] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutating, setMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user || !vehicleId) {
      setBuild(null);
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: buildData, error: buildError } = await supabase.rpc(
      'get_or_create_active_build',
      { target_vehicle_id: vehicleId }
    );

    const buildRow = Array.isArray(buildData)
      ? (buildData[0] as BuildRow | undefined)
      : (buildData as BuildRow | null);

    if (buildError || !buildRow) {
      setBuild(null);
      setItems([]);
      setError('Could not open your build plan.');
      setLoading(false);
      return;
    }

    const nextBuild = mapBuild(buildRow);
    const { data: itemRows, error: itemsError } = await supabase
      .from('build_items')
      .select(
        'id, build_id, catalog_part_id, category, part_name, brand, price, notes, sort_order, position_x, position_y, status, created_at'
      )
      .eq('build_id', nextBuild.id)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .returns<BuildItemRow[]>();

    if (itemsError) {
      setBuild(nextBuild);
      setItems([]);
      setError('Could not load build parts.');
      setLoading(false);
      return;
    }

    setBuild(nextBuild);
    setItems((itemRows ?? []).map(mapItem));
    setLoading(false);
  }, [user, vehicleId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return undefined;
    }, [refresh])
  );

  const addPart = useCallback(
    async (part: CatalogPart): Promise<boolean> => {
      if (!build) {
        setError('Open a vehicle build before adding parts.');
        return false;
      }

      setMutating(true);
      setError(null);

      const categoryItems = items.filter((item) => item.category === part.category);
      const nextSortOrder =
        categoryItems.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

      const { error: insertError } = await supabase.from('build_items').insert({
        build_id: build.id,
        catalog_part_id: part.id,
        category: part.category,
        part_name: part.name,
        brand: part.brand,
        price: part.price,
        sort_order: nextSortOrder,
        position_x: nextSortOrder * 12,
        position_y: 0,
        status: 'planned',
      });

      if (insertError) {
        setError('Could not add that part to your build.');
        setMutating(false);
        return false;
      }

      await refresh();
      setMutating(false);
      return true;
    },
    [build, items, refresh]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!build) return;

      const previous = items;
      setItems((current) => current.filter((item) => item.id !== itemId));
      setMutating(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('build_items')
        .delete()
        .eq('id', itemId)
        .eq('build_id', build.id);

      if (deleteError) {
        setItems(previous);
        setError('Could not remove that part.');
        setMutating(false);
        return;
      }

      await refresh();
      setMutating(false);
    },
    [build, items, refresh]
  );

  const moveItem = useCallback(
    async (
      itemId: string,
      nextCategory: string,
      nextSortOrder: number
    ): Promise<void> => {
      if (!build) return;

      const target = items.find((item) => item.id === itemId);
      if (!target) return;

      setMutating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('build_items')
        .update({
          category: nextCategory,
          sort_order: nextSortOrder,
          position_x: nextSortOrder * 12,
          position_y: 0,
        })
        .eq('id', itemId)
        .eq('build_id', build.id);

      if (updateError) {
        setError('Could not rearrange that part.');
        setMutating(false);
        return;
      }

      await refresh();
      setMutating(false);
    },
    [build, items, refresh]
  );

  const swapItemOrder = useCallback(
    async (firstItemId: string, secondItemId: string): Promise<void> => {
      if (!build) return;

      const first = items.find((item) => item.id === firstItemId);
      const second = items.find((item) => item.id === secondItemId);
      if (!first || !second) return;

      setMutating(true);
      setError(null);

      const [firstResult, secondResult] = await Promise.all([
        supabase
          .from('build_items')
          .update({
            sort_order: second.sortOrder,
            position_x: second.sortOrder * 12,
          })
          .eq('id', first.id)
          .eq('build_id', build.id),
        supabase
          .from('build_items')
          .update({
            sort_order: first.sortOrder,
            position_x: first.sortOrder * 12,
          })
          .eq('id', second.id)
          .eq('build_id', build.id),
      ]);

      if (firstResult.error || secondResult.error) {
        setError('Could not rearrange that part.');
        setMutating(false);
        return;
      }

      await refresh();
      setMutating(false);
    },
    [build, items, refresh]
  );

  const itemsByCategory = useMemo(() => {
    return items.reduce<Record<string, BuildItem[]>>((acc, item) => {
      const bucket = acc[item.category] ?? [];
      bucket.push(item);
      acc[item.category] = bucket;
      return acc;
    }, {});
  }, [items]);

  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );

  const buildShareCaption = useCallback((): string => {
    if (!build) return '';

    const topItems = items.slice(0, 6);
    const partsLine =
      topItems.length > 0
        ? topItems
            .map((item) => `• ${item.brand} ${item.partName}`)
            .join('\n')
        : '• Build plan started';

    return [
      `${build.title}`,
      `Estimated total: $${Math.round(totalCost).toLocaleString('en-US')}`,
      '',
      'Planned mods:',
      partsLine,
      items.length > 6 ? `\n+${items.length - 6} more parts in Planner` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [build, items, totalCost]);

  return {
    build,
    items,
    itemsByCategory,
    totalCost,
    loading,
    mutating,
    error,
    refresh,
    addPart,
    removeItem,
    moveItem,
    swapItemOrder,
    buildShareCaption,
  };
}
