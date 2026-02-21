import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useGarageSetup } from '../../hooks/useGarageSetup';
import { useProfileIdentity } from '../../hooks/useProfileIdentity';
import { theme } from '../../lib/theme';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownKey = 'vehicle' | 'year' | 'make' | 'model';
type SaveUiState = 'idle' | 'saving' | 'success';
type ProfileSection = 'vehicles' | 'posts' | 'favorites';

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
  const { user } = useAuth();
  const {
    year,
    yearOptions,
    makes,
    models,
    selectedMakeId,
    selectedModelId,
    savedVehicles,
    primaryVehicle,
    loadingMakes,
    loadingModels,
    loadingSavedVehicles,
    savingVehicle,
    deletingVehicleId,
    error,
    successMessage,
    canSaveVehicle,
    canAddVehicle,
    canOpenProUpgrade,
    isProMember,
    devBypassProVehiclePaywall,
    requiresProForAdditionalVehicles,
    hasMaxVehicleLimitReached,
    setYear,
    setSelectedMakeId,
    setSelectedModelId,
    saveSelectedVehicle,
    addSelectedVehicle,
    deleteVehicle,
  } = useGarageSetup(user);

  const [activeDropdownKey, setActiveDropdownKey] = useState<DropdownKey | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>('idle');
  const [activeSection, setActiveSection] = useState<ProfileSection>('vehicles');
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [manageVehicleExpanded, setManageVehicleExpanded] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [saveSuccessLabel, setSaveSuccessLabel] = useState('Vehicle Saved');
  const [showSaveSuccessOverlay, setShowSaveSuccessOverlay] = useState(false);
  const [saveButtonWidth, setSaveButtonWidth] = useState(0);
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSuccessRef = useRef<string | null>(null);
  const saveSuccessTranslateX = useRef(new Animated.Value(0)).current;
  const {
    username: profileUsername,
    displayName: profileDisplayName,
    avatarUrl: profileAvatarUrl,
    loading: profileIdentityLoading,
    error: profileIdentityError,
    refresh: refreshProfileIdentity,
  } = useProfileIdentity(user);

  const accountInitials = useMemo(() => {
    const raw = profileDisplayName || profileUsername || user?.email?.split('@')[0] || 'AU';
    const compact = raw.replace(/[^a-zA-Z]/g, '');
    if (!compact) return 'AU';
    return compact.slice(0, 2).toUpperCase();
  }, [profileDisplayName, profileUsername, user?.email]);

  const displayName = useMemo(() => {
    const fromProfile = profileDisplayName.trim();
    if (fromProfile.length > 0) return fromProfile;

    const fromMetadata =
      typeof user?.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : null;
    if (fromMetadata && fromMetadata.trim().length > 0) return fromMetadata.trim();

    return user?.email?.split('@')[0] ?? 'AutoLink Driver';
  }, [profileDisplayName, user]);

  const usernameHandle = useMemo(() => {
    if (profileUsername.trim().length > 0) return profileUsername.trim().toLowerCase();
    const fallback = user?.email?.split('@')[0] ?? 'driver';
    return fallback.toLowerCase();
  }, [profileUsername, user?.email]);

  const profileBio = useMemo(() => {
    const fromMetadata = typeof user?.user_metadata?.bio === 'string' ? user.user_metadata.bio : '';
    const trimmed = fromMetadata.trim();
    if (trimmed.length > 0) return trimmed;
    return 'Car enthusiast on AutoLink';
  }, [user]);

  const selectedMake = useMemo(
    () => makes.find((item) => item.makeId === selectedMakeId) ?? null,
    [makes, selectedMakeId]
  );

  const selectedModel = useMemo(
    () => models.find((item) => item.modelId === selectedModelId) ?? null,
    [models, selectedModelId]
  );

  const activeVehicle = useMemo(() => {
    if (activeVehicleId) {
      const matchingVehicle = savedVehicles.find((item) => item.id === activeVehicleId);
      if (matchingVehicle) {
        return matchingVehicle;
      }
    }
    return primaryVehicle;
  }, [activeVehicleId, primaryVehicle, savedVehicles]);

  useEffect(() => {
    if (savedVehicles.length === 0) {
      setActiveVehicleId(null);
      return;
    }

    setActiveVehicleId((currentValue) => {
      if (currentValue && savedVehicles.some((item) => item.id === currentValue)) {
        return currentValue;
      }
      return primaryVehicle?.id ?? savedVehicles[0].id;
    });
  }, [primaryVehicle?.id, savedVehicles]);

  const vehicleOptionsForDropdown = useMemo<DropdownOption[]>(
    () =>
      savedVehicles.map((item) => ({
        label: `${item.year} ${item.make} ${item.model}`,
        value: item.id,
      })),
    [savedVehicles]
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
      case 'vehicle':
        return {
          title: 'Select vehicle',
          value: activeVehicle?.id ?? null,
          options: vehicleOptionsForDropdown,
          emptyText: 'No saved vehicles.',
          onSelect: (value: string) => setActiveVehicleId(value),
        };
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
    activeVehicle?.id,
    activeDropdownKey,
    loadingMakes,
    loadingModels,
    makeOptionsForDropdown,
    modelOptionsForDropdown,
    selectedMakeId,
    selectedModelId,
    setActiveVehicleId,
    setSelectedMakeId,
    setSelectedModelId,
    setYear,
    vehicleOptionsForDropdown,
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
      setShowSaveSuccessOverlay(false);
      saveSuccessTranslateX.setValue(0);
      lastHandledSuccessRef.current = null;
      return;
    }

    if (successMessage && successMessage !== lastHandledSuccessRef.current) {
      lastHandledSuccessRef.current = successMessage;
      const normalizedMessage = successMessage.toLowerCase();
      if (normalizedMessage.includes('added')) {
        setSaveSuccessLabel('Vehicle Added');
      } else if (normalizedMessage.includes('deleted')) {
        setSaveSuccessLabel('Vehicle Deleted');
      } else {
        setSaveSuccessLabel('Vehicle Saved');
      }
      setSaveUiState('success');
      setShowSaveSuccessOverlay(true);
      saveSuccessTranslateX.stopAnimation();
      saveSuccessTranslateX.setValue(0);

      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current);
      }

      saveSuccessTimeoutRef.current = setTimeout(() => {
        Animated.timing(saveSuccessTranslateX, {
          toValue: -(saveButtonWidth || 320),
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setShowSaveSuccessOverlay(false);
          saveSuccessTranslateX.setValue(0);
          setSaveUiState('idle');
        });
        saveSuccessTimeoutRef.current = null;
      }, 900);
      return;
    }

    if (error) {
      setSaveUiState('idle');
      setShowSaveSuccessOverlay(false);
      saveSuccessTranslateX.setValue(0);
      return;
    }

    if (saveUiState !== 'success') {
      setSaveUiState('idle');
    }
  }, [error, saveButtonWidth, saveSuccessTranslateX, saveUiState, savingVehicle, successMessage]);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileIdentity();
      return undefined;
    }, [refreshProfileIdentity])
  );

  const handleSaveVehicle = (): void => {
    void saveSelectedVehicle();
  };

  const handleAddVehicle = (): void => {
    if (requiresProForAdditionalVehicles) {
      setShowProUpgradeModal(true);
      return;
    }
    void addSelectedVehicle();
  };

  const handleDeleteVehicle = (vehicleId: string): void => {
    void deleteVehicle(vehicleId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topHandle}>@{usernameHandle}</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsIconButton, pressed && styles.buttonPressed]}
          >
            <Ionicons name="settings-outline" size={18} color={theme.colors.accentGreen} />
          </Pressable>
        </View>

        <View style={styles.identitySection}>
          <View style={styles.identityTopRow}>
            <View style={styles.avatarCircleLarge}>
              {profileAvatarUrl ? (
                <Image source={{ uri: profileAvatarUrl }} style={styles.avatarImageLarge} />
              ) : (
                <Text style={styles.avatarTextLarge}>{accountInitials}</Text>
              )}
            </View>
            <View style={styles.statsInlineRow}>
              <View style={styles.statInlineItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statInlineItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
              <View style={styles.statInlineItem}>
                <Text style={styles.statValue}>{savedVehicles.length}</Text>
                <Text style={styles.statLabel}>Vehicles</Text>
              </View>
            </View>
          </View>
          <Text style={styles.identityName}>{displayName}</Text>
          <Text style={styles.identitySubtext}>{profileBio}</Text>
          {profileIdentityLoading ? (
            <View style={styles.identityLoadingRow}>
              <ActivityIndicator size="small" color={theme.colors.accentGreenMuted} />
              <Text style={styles.identityLoadingText}>Refreshing profile...</Text>
            </View>
          ) : null}

          <View style={styles.identityActionsRow}>
            <Pressable
              onPress={() => router.push('/profile-data')}
              style={({ pressed }) => [styles.identityActionButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.identityActionText}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.profileTabsBar}>
          <Pressable
            onPress={() => setActiveSection('vehicles')}
            style={({ pressed }) => [styles.profileTab, pressed && styles.buttonPressed]}
          >
            <Text
              style={[
                styles.profileTabLabel,
                activeSection === 'vehicles' && styles.profileTabLabelActive,
              ]}
            >
              Vehicles
            </Text>
            {activeSection === 'vehicles' ? <View style={styles.profileTabUnderline} /> : null}
          </Pressable>
          <Pressable
            onPress={() => setActiveSection('posts')}
            style={({ pressed }) => [styles.profileTab, pressed && styles.buttonPressed]}
          >
            <Text
              style={[
                styles.profileTabLabel,
                activeSection === 'posts' && styles.profileTabLabelActive,
              ]}
            >
              Posts
            </Text>
            {activeSection === 'posts' ? <View style={styles.profileTabUnderline} /> : null}
          </Pressable>
          <Pressable
            onPress={() => setActiveSection('favorites')}
            style={({ pressed }) => [styles.profileTab, pressed && styles.buttonPressed]}
          >
            <Text
              style={[
                styles.profileTabLabel,
                activeSection === 'favorites' && styles.profileTabLabelActive,
              ]}
            >
              Favorites
            </Text>
            {activeSection === 'favorites' ? <View style={styles.profileTabUnderline} /> : null}
          </Pressable>
        </View>
        <View style={styles.sectionDivider} />

        {activeSection === 'vehicles' ? (
          <>
            <View style={[styles.card, styles.garageCard]}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="car-outline" size={19} color={theme.colors.accentGreen} />
                <Text style={styles.sectionTitle}>Garage</Text>
              </View>
              <Text style={styles.sectionHint}>
                Your primary vehicle is used across AI, planner, and feed.
              </Text>

              {loadingSavedVehicles ? (
                <View style={styles.inlineRow}>
                  <ActivityIndicator color={theme.colors.accentGreen} />
                  <Text style={styles.inlineText}>Loading saved vehicle...</Text>
                </View>
              ) : activeVehicle ? (
                <>
                  <View style={styles.currentVehicleHeader}>
                    <Text style={styles.currentVehicleLabel}>Current vehicle</Text>
                    <Pressable
                      onPress={() => openDropdown('vehicle')}
                      disabled={savedVehicles.length < 2}
                      style={({ pressed }) => [
                        styles.currentVehiclePicker,
                        savedVehicles.length < 2 && styles.currentVehiclePickerDisabled,
                        pressed && savedVehicles.length >= 2 && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.currentVehiclePickerText}>
                        {savedVehicles.length > 1 ? 'Switch' : 'Single'}
                      </Text>
                      <Ionicons
                        name="caret-down"
                        size={12}
                        color={
                          savedVehicles.length > 1
                            ? theme.colors.accentGreenMuted
                            : theme.colors.textDisabled
                        }
                      />
                    </Pressable>
                  </View>
                  <View style={styles.primaryVehicleCard}>
                    <View style={styles.primaryLabelRow}>
                      <View style={styles.primaryDot} />
                      <Text style={styles.primaryLabel}>Active vehicle</Text>
                    </View>
                    <Text style={styles.primaryText}>
                      {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyVehicleState}>
                  <Ionicons name="car-outline" size={18} color={theme.colors.accentGreenMuted} />
                  <Text style={styles.emptyVehicleStateText}>
                    Add your first vehicle from Manage Vehicle below.
                  </Text>
                </View>
              )}

              <View style={styles.vehiclePostsCard}>
                <View style={styles.vehiclePostsHeaderRow}>
                  <Ionicons name="images-outline" size={15} color={theme.colors.accentGreenMuted} />
                  <Text style={styles.vehiclePostsTitle}>Posts for this vehicle</Text>
                </View>
                <View style={styles.vehiclePostsGrid}>
                  <View style={styles.vehiclePostTilePlaceholder} />
                  <View style={styles.vehiclePostTilePlaceholder} />
                  <View style={styles.vehiclePostTilePlaceholder} />
                </View>
                <Text style={styles.vehiclePostsHint}>
                  Phase 2: posts tagged to{' '}
                  {activeVehicle ? `${activeVehicle.year} ${activeVehicle.make}` : 'your vehicle'}{' '}
                  will appear here.
                </Text>
              </View>

              {profileIdentityError ? <Text style={styles.errorText}>{profileIdentityError}</Text> : null}
            </View>

            <View style={[styles.card, styles.manageVehicleCard]}>
              <Pressable
                onPress={() => setManageVehicleExpanded((currentValue) => !currentValue)}
                style={({ pressed }) => [styles.manageVehicleHeader, pressed && styles.buttonPressed]}
              >
                <View style={styles.manageVehicleHeaderLeft}>
                  <Ionicons name="options-outline" size={15} color={theme.colors.accentGreenMuted} />
                  <Text style={styles.manageVehicleTitle}>Manage Vehicle</Text>
                </View>
                <Ionicons
                  name={manageVehicleExpanded ? 'caret-up' : 'caret-down'}
                  size={14}
                  color={theme.colors.accentGreenMuted}
                />
              </Pressable>

              {manageVehicleExpanded ? (
                <>
                  <Text style={styles.manageVehicleHint}>
                    Change your active year/make/model, or add another vehicle for testing.
                  </Text>

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
                    disabled={!canSaveVehicle || saveUiState === 'success'}
                    style={({ pressed }) => [
                      styles.saveButtonPressable,
                      !canSaveVehicle && styles.saveButtonDisabled,
                      pressed && canSaveVehicle && saveUiState !== 'success' && styles.buttonPressed,
                    ]}
                  >
                    <View
                      style={styles.saveButton}
                      onLayout={(event) => {
                        const measuredWidth = event.nativeEvent.layout.width;
                        if (measuredWidth > 0 && measuredWidth !== saveButtonWidth) {
                          setSaveButtonWidth(measuredWidth);
                        }
                      }}
                    >
                      {saveUiState === 'saving' ? (
                        <ActivityIndicator color={theme.colors.textInverse} />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Vehicle</Text>
                      )}

                      {showSaveSuccessOverlay ? (
                        <Animated.View
                          style={[
                            styles.saveSuccessOverlay,
                            {
                              transform: [{ translateX: saveSuccessTranslateX }],
                            },
                          ]}
                        >
                          <View style={styles.saveSuccessRow}>
                            <Ionicons name="checkmark" size={18} color={theme.colors.textInverse} />
                            <Text style={styles.saveButtonText}>{saveSuccessLabel}</Text>
                          </View>
                        </Animated.View>
                      ) : null}
                    </View>
                  </Pressable>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={[styles.proCard, styles.manageProCard]}>
                    <View style={styles.proHeaderRow}>
                      <Ionicons name="sparkles-outline" size={14} color={theme.colors.brandProIcon} />
                      <Text style={styles.proTitle}>Multiple Vehicles</Text>
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    </View>
                    <Text style={styles.proBodyText}>
                      Free plan includes 1 active vehicle. Upgrade to Pro to save and switch between
                      multiple cars.
                    </Text>

                    <Pressable
                      onPress={handleAddVehicle}
                      disabled={!canAddVehicle && !canOpenProUpgrade}
                      style={({ pressed }) => [
                        styles.proCtaDisabled,
                        !canAddVehicle && !canOpenProUpgrade && styles.proCtaBlocked,
                        savingVehicle && styles.proCtaLoading,
                        pressed && (canAddVehicle || canOpenProUpgrade) && styles.buttonPressed,
                      ]}
                    >
                      {savingVehicle ? (
                        <ActivityIndicator color={theme.colors.textProCta} />
                      ) : (
                        <Ionicons
                          name={
                            hasMaxVehicleLimitReached
                              ? 'ban-outline'
                              : requiresProForAdditionalVehicles
                                ? 'lock-closed-outline'
                                : 'add'
                          }
                          size={18}
                          color={theme.colors.textProCta}
                        />
                      )}
                      <Text style={styles.proCtaText}>
                        {hasMaxVehicleLimitReached
                          ? 'Vehicle limit reached (5 max)'
                          : requiresProForAdditionalVehicles
                            ? 'Unlock Pro to add vehicles'
                            : 'Add another vehicle'}
                      </Text>
                    </Pressable>
                    {__DEV__ && devBypassProVehiclePaywall && !isProMember ? (
                      <Text style={styles.proDebugText}>
                        Dev bypass active: additional vehicles are unlocked on this build.
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          </>
        ) : activeSection === 'posts' ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Ionicons name="images-outline" size={42} color={theme.colors.iconSubtle} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Share your first build update once feed posting goes live.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <Ionicons name="heart-outline" size={42} color={theme.colors.iconSubtle} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Save parts, posts, or builds to quickly revisit them later.
            </Text>
          </View>
        )}

        <View style={styles.footerInline}>
          <Ionicons name="information-circle-outline" size={13} color={theme.colors.textMuted} />
          <Text style={styles.footerText}>Social features are rolling out in upcoming phases.</Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={activeDropdown !== null}
        onRequestClose={closeDropdown}
      >
        <GestureHandlerRootView style={styles.modalGestureRoot}>
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
                  {activeDropdownKey === 'vehicle' && activeDropdown.options.length > 1 ? (
                    <Text style={styles.modalSwipeHint}>Swipe left on a vehicle to delete it.</Text>
                  ) : null}
                  {activeDropdown.options.map((option) => {
                    const isSelected = activeDropdown.value === option.value;
                    const optionKey = `${activeDropdown.title}-${option.value}-${option.label}`;
                    const isVehicleOption = activeDropdownKey === 'vehicle';
                    const isDeleteInProgress = deletingVehicleId === option.value;

                    const optionRow = (
                      <Pressable
                        key={optionKey}
                        disabled={Boolean(deletingVehicleId)}
                        onPress={() => {
                          activeDropdown.onSelect(option.value);
                          closeDropdown();
                        }}
                        style={({ pressed }) => [
                          styles.modalOption,
                          isSelected && styles.modalOptionSelected,
                          pressed && !deletingVehicleId && styles.buttonPressed,
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

                    if (!isVehicleOption || activeDropdown.options.length <= 1) {
                      return optionRow;
                    }

                    return (
                      <Swipeable
                        key={optionKey}
                        overshootRight={false}
                        renderRightActions={() => (
                          <Pressable
                            onPress={() => handleDeleteVehicle(option.value)}
                            disabled={Boolean(deletingVehicleId)}
                            style={({ pressed }) => [
                              styles.modalDeleteAction,
                              pressed && !deletingVehicleId && styles.buttonPressed,
                            ]}
                          >
                            {isDeleteInProgress ? (
                              <ActivityIndicator color={theme.colors.textInverse} />
                            ) : (
                              <Text style={styles.modalDeleteActionText}>Delete</Text>
                            )}
                          </Pressable>
                        )}
                      >
                        {optionRow}
                      </Swipeable>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.modalEmptyText}>{activeDropdown?.emptyText}</Text>
              )}
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={showProUpgradeModal}
        onRequestClose={() => setShowProUpgradeModal(false)}
      >
        <View style={styles.upgradeModalContainer}>
          <Pressable style={styles.upgradeModalBackdrop} onPress={() => setShowProUpgradeModal(false)} />
          <View style={styles.upgradeModalCard}>
            <View style={styles.upgradeModalHeaderRow}>
              <Text style={styles.upgradeModalTitle}>Pro Required</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.upgradeModalBody}>
              Free plan includes 1 vehicle. Upgrade to Pro to save and switch between multiple
              vehicles.
            </Text>
            <Pressable
              onPress={() => setShowProUpgradeModal(false)}
              style={({ pressed }) => [
                styles.upgradeModalPrimaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.upgradeModalPrimaryText}>Upgrade Flow Coming Soon</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowProUpgradeModal(false)}
              style={({ pressed }) => [styles.upgradeModalSecondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.upgradeModalSecondaryText}>Not now</Text>
            </Pressable>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topBarSpacer: {
    width: 36,
    height: 36,
  },
  topHandle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.accentGreen,
    letterSpacing: -0.2,
  },
  settingsIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
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
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
  },
  identitySection: {
    marginBottom: 8,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.brandAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%',
  },
  avatarTextLarge: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 22,
  },
  statsInlineRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  statInlineItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  identityName: {
    marginTop: 12,
    color: theme.colors.accentGreen,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  identitySubtext: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  identityLoadingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  identityLoadingText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  identityActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  identityActionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 9,
    alignItems: 'center',
  },
  identityActionText: {
    color: theme.colors.textSubtle,
    fontSize: 14,
    fontWeight: '700',
  },
  statValue: {
    color: theme.colors.accentGreen,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  statLabel: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileTabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderDefault,
    marginBottom: 2,
  },
  profileTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 7,
  },
  profileTabLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  profileTabLabelActive: {
    color: theme.colors.accentGreen,
    fontWeight: '700',
  },
  profileTabUnderline: {
    marginTop: 6,
    height: 2,
    borderRadius: 2,
    width: '78%',
    backgroundColor: theme.colors.accentGreen,
  },
  sectionDivider: {
    height: 10,
  },
  garageCard: {
    backgroundColor: theme.colors.surfaceBrandSoft,
    borderColor: theme.colors.borderLight,
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
    color: theme.colors.accentGreen,
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
    color: theme.colors.accentGreen,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    color: theme.colors.accentGreen,
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
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accentGreen,
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
    backgroundColor: theme.colors.accentGreenMuted,
  },
  primaryLabel: {
    color: theme.colors.accentGreenMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  primaryText: {
    marginTop: 4,
    marginLeft: 13,
    color: theme.colors.accentGreen,
    fontWeight: '600',
    fontSize: 16,
  },
  currentVehicleHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentVehicleLabel: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  currentVehiclePicker: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currentVehiclePickerDisabled: {
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surfaceDisabled,
  },
  currentVehiclePickerText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyVehicleState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyVehicleStateText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  vehiclePostsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surface,
    padding: 12,
  },
  vehiclePostsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehiclePostsTitle: {
    color: theme.colors.accentGreenMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  vehiclePostsGrid: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  vehiclePostTilePlaceholder: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
  },
  vehiclePostsHint: {
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  manageVehicleCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  manageVehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  manageVehicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  manageVehicleTitle: {
    color: theme.colors.accentGreen,
    fontSize: 16,
    fontWeight: '700',
  },
  manageVehicleHint: {
    marginTop: 8,
    marginBottom: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: theme.colors.accentGreenMuted,
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
    color: theme.colors.accentGreen,
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
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  saveSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.buttonSaveSuccess,
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
    color: theme.colors.accentGreenMuted,
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
  manageProCard: {
    marginTop: 12,
    marginBottom: 0,
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
  proCtaLoading: {
    opacity: 0.72,
  },
  proCtaBlocked: {
    opacity: 0.62,
  },
  proDebugText: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  emptyCard: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 10,
    color: theme.colors.accentGreen,
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerInline: {
    marginTop: 2,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
  modalGestureRoot: {
    flex: 1,
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
    color: theme.colors.accentGreen,
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
  modalSwipeHint: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontSize: 12,
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
    color: theme.colors.accentGreen,
    fontWeight: '700',
  },
  modalEmptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 18,
    marginBottom: 8,
  },
  modalDeleteAction: {
    marginTop: 8,
    marginLeft: 8,
    minWidth: 84,
    borderRadius: 10,
    backgroundColor: theme.colors.textDanger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalDeleteActionText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeModalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  upgradeModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfaceOverlay,
  },
  upgradeModalCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderPro,
    backgroundColor: theme.colors.surfacePro,
    padding: 18,
  },
  upgradeModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  upgradeModalTitle: {
    color: theme.colors.textProTitle,
    fontSize: 20,
    fontWeight: '700',
  },
  upgradeModalBody: {
    marginTop: 10,
    color: theme.colors.textProBody,
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeModalPrimaryButton: {
    marginTop: 14,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandProIcon,
  },
  upgradeModalPrimaryText: {
    color: theme.colors.textIconDark,
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeModalSecondaryButton: {
    marginTop: 8,
    borderRadius: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderProCta,
    backgroundColor: theme.colors.surfaceProCta,
  },
  upgradeModalSecondaryText: {
    color: theme.colors.textProCta,
    fontSize: 14,
    fontWeight: '600',
  },
});
