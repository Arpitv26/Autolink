import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  filterCatalogParts,
  formatUsd,
  getCatalogBrands,
  getCatalogCategories,
  type CatalogPart,
} from '../../lib/partsCatalog';
import { theme } from '../../lib/theme';

type CatalogBrowserProps = {
  disabled?: boolean;
  adding: boolean;
  onAddPart: (part: CatalogPart) => void;
};

export function CatalogBrowser({
  disabled = false,
  adding,
  onAddPart,
}: CatalogBrowserProps) {
  const categories = useMemo(() => getCatalogCategories(), []);
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const brands = useMemo(() => getCatalogBrands(category), [category]);
  const parts = useMemo(
    () =>
      filterCatalogParts({
        category,
        brand,
        query,
        maxPrice: maxPrice.trim().length > 0 ? Number(maxPrice) : null,
      }),
    [brand, category, maxPrice, query]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Parts catalog</Text>
      <Text style={styles.subtitle}>Filter and add mocked parts to your build.</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search parts, brands, categories"
        placeholderTextColor={theme.colors.textPlaceholder}
        style={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable
          onPress={() => {
            setCategory(null);
            setBrand(null);
          }}
          style={[styles.chip, category === null && styles.chipSelected]}
        >
          <Text style={[styles.chipText, category === null && styles.chipTextSelected]}>
            All
          </Text>
        </Pressable>
        {categories.map((item) => {
          const selected = category === item;
          return (
            <Pressable
              key={item}
              onPress={() => {
                setCategory(item);
                setBrand(null);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {brands.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            onPress={() => setBrand(null)}
            style={[styles.chipMuted, brand === null && styles.chipSelected]}
          >
            <Text style={[styles.chipText, brand === null && styles.chipTextSelected]}>
              Any brand
            </Text>
          </Pressable>
          {brands.map((item) => {
            const selected = brand === item;
            return (
              <Pressable
                key={item}
                onPress={() => setBrand(item)}
                style={[styles.chipMuted, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <TextInput
        value={maxPrice}
        onChangeText={setMaxPrice}
        keyboardType="numeric"
        placeholder="Max price (optional)"
        placeholderTextColor={theme.colors.textPlaceholder}
        style={styles.searchInput}
      />

      <Text style={styles.resultCount}>{parts.length} parts</Text>

      <View style={styles.list}>
        {parts.slice(0, 40).map((part) => (
          <View key={part.id} style={styles.partRow}>
            <View style={styles.partCopy}>
              <Text style={styles.partName}>
                {part.brand} {part.name}
              </Text>
              <Text style={styles.partMeta}>
                {part.category} · {formatUsd(part.price)}
              </Text>
            </View>
            <Pressable
              disabled={disabled || adding}
              onPress={() => onAddPart(part)}
              style={({ pressed }) => [
                styles.addButton,
                (disabled || adding) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {adding ? (
                <ActivityIndicator size="small" color={theme.colors.textIconDark} />
              ) : (
                <Ionicons name="add" size={18} color={theme.colors.textIconDark} />
              )}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 14,
  },
  title: {
    color: theme.colors.textHeading,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  searchInput: {
    minHeight: 44,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
  },
  chipMuted: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.appBackground,
    paddingHorizontal: 11,
  },
  chipSelected: {
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.brandPrimary,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: theme.colors.textIconDark,
  },
  resultCount: {
    marginBottom: 8,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.appBackground,
    padding: 10,
  },
  partCopy: {
    flex: 1,
  },
  partName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  partMeta: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
