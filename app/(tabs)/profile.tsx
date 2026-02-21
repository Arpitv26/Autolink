import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useGarageSetup } from '../../hooks/useGarageSetup';
import { theme } from '../../lib/theme';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownKey = 'year' | 'make' | 'model';
type SaveUiState = 'idle' | 'saving' | 'success';

type ActiveDropdown = {
  title: string;
  value: string | null;
  options: DropdownOption[];
  emptyText: string;
  onSelect: (value: string) => void;
};

type DropdownFieldProps = {
  label: string;
  valueLabel: string | null;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
};

function DropdownField({
  label,
  valueLabel,
  placeholder,
  disabled = false,
  onPress,
}: DropdownFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        <Text
          style={[
            styles.dropdownValue,
            !valueLabel && styles.dropdownPlaceholder,
            disabled && styles.dropdownValueDisabled,
          ]}
          numberOfLines={1}
        >
          {valueLabel ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? theme.colors.textDisabled : theme.colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const {
    year,
    yearOptions,
    makes,
    models,
    selectedMakeId,
    selectedModelId,
    primaryVehicle,
    loadingMakes,
    loadingModels,
    loadingSavedVehicles,
    savingVehicle,
    error,
    successMessage,
    canSaveVehicle,
    hasFreeVehicleLimitReached,
    setYear,
    setSelectedMakeId,
    setSelectedModelId,
    saveSelectedVehicle,
  } = useGarageSetup(user);

  const [activeDropdownKey, setActiveDropdownKey] = useState<DropdownKey | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>('idle');
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSuccessRef = useRef<string | null>(null);
  const saveColorProgress = useRef(new Animated.Value(0)).current;

  const accountInitials = useMemo(() => {
    const raw = user?.email?.split('@')[0] ?? 'AU';
    const compact = raw.replace(/[^a-zA-Z]/g, '');
    if (!compact) return 'AU';
    return compact.slice(0, 2).toUpperCase();
  }, [user?.email]);

  const selectedMake = useMemo(
    () => makes.find((item) => item.makeId === selectedMakeId) ?? null,
    [makes, selectedMakeId]
  );

  const selectedModel = useMemo(
    () => models.find((item) => item.modelId === selectedModelId) ?? null,
    [models, selectedModelId]
  );

  const yearOptionsForDropdown = useMemo<DropdownOption[]>(
    () => yearOptions.map((item) => ({ label: item, value: item })),
    [yearOptions]
  );

  const makeOptionsForDropdown = useMemo<DropdownOption[]>(
    () =>
      makes.map((item) => ({
        label: item.makeName,
        value: String(item.makeId),
      })),
    [makes]
  );

  const modelOptionsForDropdown = useMemo<DropdownOption[]>(
    () =>
      models.map((item) => ({
        label: item.modelName,
        value: String(item.modelId),
      })),
    [models]
  );

  const activeDropdown = useMemo<ActiveDropdown | null>(() => {
    switch (activeDropdownKey) {
      case 'year':
        return {
          title: 'Select model year',
          value: year.length === 4 ? year : null,
          options: yearOptionsForDropdown,
          emptyText: 'No years available.',
          onSelect: (value: string) => setYear(value),
        };
      case 'make':
        return {
          title: 'Select make',
          value: selectedMakeId ? String(selectedMakeId) : null,
          options: makeOptionsForDropdown,
          emptyText: loadingMakes ? 'Loading makes...' : 'No makes available.',
          onSelect: (value: string) => setSelectedMakeId(Number(value)),
        };
      case 'model':
        return {
          title: 'Select model',
          value: selectedModelId ? String(selectedModelId) : null,
          options: modelOptionsForDropdown,
          emptyText: loadingModels ? 'Loading models...' : 'No models available.',
          onSelect: (value: string) => setSelectedModelId(Number(value)),
        };
      default:
        return null;
    }
  }, [
    activeDropdownKey,
    loadingMakes,
    loadingModels,
    makeOptionsForDropdown,
    modelOptionsForDropdown,
    selectedMakeId,
    selectedModelId,
    setSelectedMakeId,
    setSelectedModelId,
    setYear,
    year,
    yearOptionsForDropdown,
  ]);

  const openDropdown = (key: DropdownKey): void => {
    if (key === 'make' && (year.length !== 4 || loadingMakes)) return;
    if (key === 'model' && (!selectedMakeId || loadingModels)) return;
    setActiveDropdownKey(key);
  };

  const closeDropdown = (): void => {
    setActiveDropdownKey(null);
  };

  useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (savingVehicle) {
      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current);
      }
      setSaveUiState('saving');
      lastHandledSuccessRef.current = null;
      return;
    }

    if (successMessage && successMessage !== lastHandledSuccessRef.current) {
      lastHandledSuccessRef.current = successMessage;
      setSaveUiState('success');

      Animated.timing(saveColorProgress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start();

      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current);
      }

      saveSuccessTimeoutRef.current = setTimeout(() => {
        Animated.timing(saveColorProgress, {
          toValue: 0,
          duration: 260,
          useNativeDriver: false,
        }).start(() => {
          setSaveUiState('idle');
        });
        saveSuccessTimeoutRef.current = null;
      }, 1800);
      return;
    }

    if (error) {
      setSaveUiState('idle');
      Animated.timing(saveColorProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
      return;
    }

    if (saveUiState !== 'success') {
      setSaveUiState('idle');
    }
  }, [error, saveColorProgress, saveUiState, savingVehicle, successMessage]);

  const handleSaveVehicle = (): void => {
    void saveSelectedVehicle();
  };

  const saveButtonBackgroundColor = saveColorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.buttonPrimary, theme.colors.buttonSuccess],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Text style={styles.pageSubtitle}>Manage your account and garage.</Text>

        <View style={styles.card}>
          <View style={styles.accountRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{accountInitials}</Text>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountTitle}>Account</Text>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={14} color={theme.colors.textSecondary} />
                <Text numberOfLines={1} style={styles.accountEmail}>
                  {user?.email ?? 'Signed-in account'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/profile-data')}
            style={({ pressed }) => [styles.dataButton, pressed && styles.buttonPressed]}
          >
            <View style={styles.dataButtonLeft}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.dataButtonText}>Data & Personal Info</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.iconSubtle} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="car-outline" size={19} color={theme.colors.textIconDark} />
            <Text style={styles.sectionTitle}>Garage</Text>
          </View>
          <Text style={styles.sectionHint}>
            Your primary vehicle is used across AI, planner, and feed.
          </Text>

          {loadingSavedVehicles ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator color={theme.colors.textIconDark} />
              <Text style={styles.inlineText}>Loading saved vehicle...</Text>
            </View>
          ) : primaryVehicle ? (
            <View style={styles.primaryVehicleCard}>
              <View style={styles.primaryLabelRow}>
                <View style={styles.primaryDot} />
                <Text style={styles.primaryLabel}>Primary vehicle</Text>
              </View>
              <Text style={styles.primaryText}>
                {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
              </Text>
            </View>
          ) : null}

          <DropdownField
            label="Model Year"
            valueLabel={year.length === 4 ? year : null}
            placeholder="Select year"
            onPress={() => openDropdown('year')}
          />

          <DropdownField
            label="Make"
            valueLabel={selectedMake?.makeName ?? null}
            placeholder={
              loadingMakes
                ? 'Loading makes...'
                : year.length === 4
                  ? 'Select make'
                  : 'Select year first'
            }
            disabled={year.length !== 4 || loadingMakes}
            onPress={() => openDropdown('make')}
          />

          <DropdownField
            label="Model"
            valueLabel={selectedModel?.modelName ?? null}
            placeholder={
              loadingModels
                ? 'Loading models...'
                : selectedMakeId
                  ? 'Select model'
                  : 'Select make first'
            }
            disabled={!selectedMakeId || loadingModels}
            onPress={() => openDropdown('model')}
          />

          <Pressable
            onPress={handleSaveVehicle}
            disabled={!canSaveVehicle}
            style={({ pressed }) => [
              styles.saveButtonPressable,
              !canSaveVehicle && styles.saveButtonDisabled,
              pressed && canSaveVehicle && styles.buttonPressed,
            ]}
          >
            <Animated.View style={[styles.saveButton, { backgroundColor: saveButtonBackgroundColor }]}>
              {saveUiState === 'saving' ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : saveUiState === 'success' ? (
                <View style={styles.saveSuccessRow}>
                  <Ionicons name="checkmark" size={18} color={theme.colors.textInverse} />
                  <Text style={styles.saveButtonText}>Vehicle Saved</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Vehicle</Text>
              )}
            </Animated.View>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.proCard}>
          <View style={styles.proHeaderRow}>
            <Ionicons name="sparkles-outline" size={14} color={theme.colors.brandProIcon} />
            <Text style={styles.proTitle}>Multiple Vehicles</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.proBodyText}>
            Free plan includes 1 active vehicle. Upgrade to Pro to save and switch between multiple cars.
          </Text>

          <Pressable disabled style={styles.proCtaDisabled}>
            <Ionicons name="add" size={18} color={theme.colors.borderDefault} />
            <Text style={styles.proCtaText}>
              {hasFreeVehicleLimitReached ? 'Add another vehicle' : 'Unlock Pro vehicles'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.colors.textDangerStrong} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.footerText}>AutoLink v1.0 - Phase 1</Text>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={activeDropdown !== null}
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={closeDropdown} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeDropdown?.title}</Text>
              <Pressable onPress={closeDropdown} style={styles.modalCloseButton}>
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {activeDropdown && activeDropdown.options.length > 0 ? (
              <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                {activeDropdown.options.map((option) => {
                  const isSelected = activeDropdown.value === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        activeDropdown.onSelect(option.value);
                        closeDropdown();
                      }}
                      style={({ pressed }) => [
                        styles.modalOption,
                        isSelected && styles.modalOptionSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={[styles.modalOptionLabel, isSelected && styles.modalOptionLabelSelected]}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={18} color={theme.colors.brandPrimary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.modalEmptyText}>{activeDropdown?.emptyText}</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.appBackground,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: 2,
    marginBottom: 18,
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    marginBottom: 14,
    shadowColor: theme.colors.shadowColor,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.brandAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
  accountDetails: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emailRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  accountEmail: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  dataButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dataButtonText: {
    color: theme.colors.textSubtle,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 27,
    fontWeight: '700',
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 14,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 26,
  },
  primaryVehicleCard: {
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceBrand,
    borderWidth: 1,
    borderColor: theme.colors.borderBrandSoft,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  primaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  primaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brandSecondary,
  },
  primaryLabel: {
    color: theme.colors.brandSecondary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  primaryText: {
    marginTop: 4,
    marginLeft: 13,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  dropdownButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  dropdownValue: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  dropdownPlaceholder: {
    color: theme.colors.textPlaceholder,
    fontWeight: '500',
  },
  dropdownValueDisabled: {
    color: theme.colors.textDisabled,
  },
  saveButtonPressable: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    color: theme.colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: theme.colors.textDanger,
    fontSize: 14,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inlineText: {
    color: theme.colors.textFieldReadOnly,
    fontSize: 14,
  },
  proCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderPro,
    backgroundColor: theme.colors.surfacePro,
    padding: 14,
    marginBottom: 14,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  proTitle: {
    color: theme.colors.textProTitle,
    fontSize: 17,
    fontWeight: '700',
  },
  proBadge: {
    marginLeft: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: theme.colors.surfaceProBadge,
    borderWidth: 1,
    borderColor: theme.colors.borderProBadge,
  },
  proBadgeText: {
    color: theme.colors.textProBadge,
    fontSize: 11,
    fontWeight: '700',
  },
  proBodyText: {
    marginTop: 8,
    color: theme.colors.textProBody,
    lineHeight: 20,
    fontSize: 14,
  },
  proCtaDisabled: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderProCta,
    backgroundColor: theme.colors.surfaceProCta,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  proCtaText: {
    color: theme.colors.textProCta,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSoft,
    backgroundColor: theme.colors.surfaceDangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  logoutText: {
    color: theme.colors.textDangerStrong,
    fontSize: 20,
    fontWeight: '500',
  },
  footerText: {
    marginTop: 10,
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfaceOverlay,
  },
  modalSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 30,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: theme.colors.textIconDark,
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceChip,
  },
  modalList: {
    maxHeight: 380,
  },
  modalListContent: {
    paddingBottom: 8,
  },
  modalOption: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.surfaceBrand,
    borderColor: theme.colors.borderBrand,
  },
  modalOptionLabel: {
    color: theme.colors.textSubtle,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  modalOptionLabelSelected: {
    color: theme.colors.brandDeep,
    fontWeight: '700',
  },
  modalEmptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 18,
    marginBottom: 8,
  },
});
