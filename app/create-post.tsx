import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useCreatePost } from '../hooks/useCreatePost';
import { theme } from '../lib/theme';

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0];
  }
  return null;
}

export default function CreatePostScreen() {
  const params = useLocalSearchParams<{
    vehicleId?: string | string[];
    buildId?: string | string[];
    caption?: string | string[];
  }>();
  const initialVehicleId = useMemo(() => firstParam(params.vehicleId), [params.vehicleId]);
  const buildId = useMemo(() => firstParam(params.buildId), [params.buildId]);
  const initialCaption = useMemo(() => firstParam(params.caption) ?? '', [params.caption]);

  const { user } = useAuth();
  const {
    images,
    vehicles,
    selectedVehicleId,
    loadingVehicles,
    picking,
    publishing,
    error,
    setSelectedVehicleId,
    pickImages,
    removeImage,
    publish,
  } = useCreatePost(user, {
    initialVehicleId,
    buildId,
  });
  const [caption, setCaption] = useState<string>(initialCaption);

  const handlePublish = useCallback(async (): Promise<void> => {
    const published = await publish(caption);
    if (published) {
      router.replace('/(tabs)/feed');
    }
  }, [caption, publish]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={21} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            {buildId ? 'Share your build' : 'Share a build update'}
          </Text>
          <Text style={styles.subtitle}>
            {buildId
              ? 'Add photos for this Planner build, then publish to the Feed.'
              : 'Choose up to five photos and tell the community what changed.'}
          </Text>
          {buildId ? (
            <View style={styles.buildLinkBanner}>
              <Ionicons name="construct-outline" size={16} color={theme.colors.accentGreenMuted} />
              <Text style={styles.buildLinkText}>Linked to your Planner build</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Post about</Text>
          {loadingVehicles ? (
            <View style={styles.vehicleLoading}>
              <ActivityIndicator size="small" color={theme.colors.accentGreenMuted} />
              <Text style={styles.vehicleLoadingText}>Loading your garage…</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleOptions}
            >
              <Pressable
                onPress={() => setSelectedVehicleId(null)}
                style={({ pressed }) => [
                  styles.vehicleChip,
                  selectedVehicleId === null && styles.vehicleChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={15}
                  color={
                    selectedVehicleId === null
                      ? theme.colors.textIconDark
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.vehicleChipText,
                    selectedVehicleId === null && styles.vehicleChipTextSelected,
                  ]}
                >
                  General post
                </Text>
              </Pressable>

              {vehicles.map((vehicle) => {
                const selected = selectedVehicleId === vehicle.id;
                return (
                  <Pressable
                    key={vehicle.id}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                    style={({ pressed }) => [
                      styles.vehicleChip,
                      selected && styles.vehicleChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="car-sport-outline"
                      size={15}
                      color={
                        selected ? theme.colors.textIconDark : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.vehicleChipText,
                        selected && styles.vehicleChipTextSelected,
                      ]}
                    >
                      {vehicle.label}
                      {vehicle.isPrimary ? ' · Primary' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.label}>Photos</Text>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewRow}
            >
              {images.map((asset) => (
                <View key={asset.uri} style={styles.previewWrap}>
                  <Image source={asset.uri} style={styles.previewImage} contentFit="cover" />
                  <Pressable
                    onPress={() => removeImage(asset.uri)}
                    style={styles.removeButton}
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons name="close" size={14} color={theme.colors.textInverse} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPreview}>
              <Ionicons name="images-outline" size={34} color={theme.colors.iconSubtle} />
              <Text style={styles.emptyText}>Add at least one vehicle photo.</Text>
            </View>
          )}

          <Pressable
            onPress={() => void pickImages()}
            disabled={picking || publishing}
            style={({ pressed }) => [
              styles.photoButton,
              (picking || publishing) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {picking ? (
              <ActivityIndicator color={theme.colors.accentGreenMuted} />
            ) : (
              <>
                <Ionicons name="image-outline" size={18} color={theme.colors.accentGreenMuted} />
                <Text style={styles.photoButtonText}>
                  {images.length > 0 ? 'Choose Different Photos' : 'Choose Photos'}
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What did you install, change, or learn?"
            placeholderTextColor={theme.colors.textPlaceholder}
            style={styles.captionInput}
            multiline
            maxLength={2200}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{caption.length}/2200</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => void handlePublish()}
            disabled={publishing || images.length === 0}
            style={({ pressed }) => [
              styles.publishButton,
              (publishing || images.length === 0) && styles.disabled,
              pressed && !publishing && images.length > 0 && styles.pressed,
            ]}
          >
            {publishing ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={styles.publishText}>Publish Post</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    color: theme.colors.textHeading,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 38,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
  title: {
    color: theme.colors.textHeading,
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 20,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  buildLinkBanner: {
    marginTop: -8,
    marginBottom: 16,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    backgroundColor: theme.colors.surfaceBrand,
    paddingHorizontal: 12,
  },
  buildLinkText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    marginBottom: 7,
    color: theme.colors.accentGreenMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  vehicleLoading: {
    minHeight: 42,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleLoadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  vehicleOptions: {
    gap: 8,
    paddingBottom: 18,
  },
  vehicleChip: {
    minHeight: 40,
    maxWidth: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
  },
  vehicleChipSelected: {
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.brandPrimary,
  },
  vehicleChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleChipTextSelected: {
    color: theme.colors.textIconDark,
  },
  previewRow: {
    gap: 10,
    paddingBottom: 12,
  },
  previewWrap: {
    position: 'relative',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
  },
  removeButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceOverlay,
  },
  emptyPreview: {
    height: 150,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  photoButton: {
    minHeight: 44,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
  },
  photoButtonText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  captionInput: {
    minHeight: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderInput,
    backgroundColor: theme.colors.surfaceMuted,
    padding: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  characterCount: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
  },
  publishButton: {
    minHeight: 50,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.buttonPrimary,
  },
  publishText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '900',
  },
  error: {
    marginTop: 10,
    color: theme.colors.textDanger,
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
