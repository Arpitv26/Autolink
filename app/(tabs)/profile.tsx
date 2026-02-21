import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
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
import Reanimated, {
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
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
type PendingVehicleDeletion = {
  id: string;
  label: string;
};

const VEHICLE_CARD_LAYOUT_TRANSITION = LinearTransition.duration(260);
const PROFILE_SECTION_ORDER: ProfileSection[] = ['vehicles', 'posts', 'favorites'];

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

function ProfileSectionIcon({
  section,
  focused,
}: {
  section: ProfileSection;
  focused: boolean;
}) {
  const color = focused ? theme.colors.accentGreen : theme.colors.textMuted;
  const size = focused ? 22 : 19;

  if (section === 'vehicles') {
    return <MaterialCommunityIcons name="car-outline" size={size} color={color} />;
  }

  if (section === 'posts') {
    return <Ionicons name="images-outline" size={size} color={color} />;
  }

  return <Ionicons name="heart-outline" size={size} color={color} />;
}

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
    savedVehiclesError,
    error,
    successMessage,
    canSaveVehicle,
    canAddVehicle,
    canOpenProUpgrade,
    isProMember,
    devBypassProVehiclePaywall,
    requiresProForAdditionalVehicles,
    hasMaxVehicleLimitReached,
    refreshGarage,
    setYear,
    setSelectedMakeId,
    setSelectedModelId,
    setPrimaryVehicle,
    saveSelectedVehicle,
    addSelectedVehicle,
    deleteVehicle,
  } = useGarageSetup(user);

  const [activeDropdownKey, setActiveDropdownKey] = useState<DropdownKey | null>(null);
  const [saveUiState, setSaveUiState] = useState<SaveUiState>('idle');
  const [activeSection, setActiveSection] = useState<ProfileSection>('vehicles');
  const [tabTransitionDirection, setTabTransitionDirection] = useState<1 | -1>(1);
  const [tabsBarWidth, setTabsBarWidth] = useState(0);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [switchingVehicleId, setSwitchingVehicleId] = useState<string | null>(null);
  const [manageVehicleExpanded, setManageVehicleExpanded] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [pendingVehicleDeletion, setPendingVehicleDeletion] =
    useState<PendingVehicleDeletion | null>(null);
  const [saveSuccessLabel, setSaveSuccessLabel] = useState('Vehicle Saved');
  const [showSaveSuccessOverlay, setShowSaveSuccessOverlay] = useState(false);
  const [saveButtonWidth, setSaveButtonWidth] = useState(0);
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSuccessRef = useRef<string | null>(null);
  const saveSuccessTranslateX = useRef(new RNAnimated.Value(0)).current;
  const tabIndicatorTranslateX = useRef(new RNAnimated.Value(0)).current;
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

  const isInitialGarageLoading = loadingSavedVehicles && savedVehicles.length === 0;
  const showGarageLoadError = Boolean(savedVehiclesError) && savedVehicles.length === 0;
  const activeSectionIndex = useMemo(
    () => Math.max(0, PROFILE_SECTION_ORDER.indexOf(activeSection)),
    [activeSection]
  );
  const tabSegmentWidth = useMemo(
    () => (tabsBarWidth > 0 ? tabsBarWidth / PROFILE_SECTION_ORDER.length : 0),
    [tabsBarWidth]
  );
  const tabIndicatorWidth = useMemo(
    () => (tabSegmentWidth > 0 ? tabSegmentWidth * 0.42 : 0),
    [tabSegmentWidth]
  );

  const orderedVehicles = useMemo(() => {
    if (!activeVehicle?.id) return savedVehicles;
    const activeFirst = savedVehicles.find((item) => item.id === activeVehicle.id);
    if (!activeFirst) return savedVehicles;
    return [activeFirst, ...savedVehicles.filter((item) => item.id !== activeFirst.id)];
  }, [activeVehicle?.id, savedVehicles]);

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

  const handleSelectVehicle = useCallback(
    (vehicleId: string): void => {
      if (
        vehicleId === activeVehicle?.id ||
        savingVehicle ||
        Boolean(switchingVehicleId) ||
        Boolean(deletingVehicleId)
      ) {
        return;
      }

      const previousVehicleId = activeVehicle?.id ?? null;
      setActiveVehicleId(vehicleId);

      void (async () => {
        setSwitchingVehicleId(vehicleId);
        try {
          const didSwitch = await setPrimaryVehicle(vehicleId);
          if (!didSwitch) {
            setActiveVehicleId(previousVehicleId);
          }
        } finally {
          setSwitchingVehicleId((currentValue) =>
            currentValue === vehicleId ? null : currentValue
          );
        }
      })();
    },
    [
      activeVehicle?.id,
      deletingVehicleId,
      savingVehicle,
      setPrimaryVehicle,
      switchingVehicleId,
    ]
  );

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
          onSelect: (value: string) => handleSelectVehicle(value),
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
    handleSelectVehicle,
    setSelectedMakeId,
    setSelectedModelId,
    setYear,
    vehicleOptionsForDropdown,
    year,
    yearOptionsForDropdown,
  ]);

  const openDropdown = (key: DropdownKey): void => {
    if (savingVehicle) return;
    if (key === 'make' && (year.length !== 4 || loadingMakes)) return;
    if (key === 'model' && (!selectedMakeId || loadingModels)) return;
    setActiveDropdownKey(key);
  };

  const closeDropdown = (): void => {
    setActiveDropdownKey(null);
  };

  useEffect(() => {
    if (tabSegmentWidth <= 0 || tabIndicatorWidth <= 0) return;

    const centeredOffset = (tabSegmentWidth - tabIndicatorWidth) / 2;
    RNAnimated.timing(tabIndicatorTranslateX, {
      toValue: tabSegmentWidth * activeSectionIndex + centeredOffset,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeSectionIndex, tabIndicatorTranslateX, tabIndicatorWidth, tabSegmentWidth]);

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
      } else if (normalizedMessage.includes('switched')) {
        setSaveSuccessLabel('Vehicle Switched');
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
        RNAnimated.timing(saveSuccessTranslateX, {
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
      void refreshGarage();
      return undefined;
    }, [refreshGarage, refreshProfileIdentity])
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

  const requestDeleteVehicle = useCallback(
    (vehicleId: string): void => {
      const targetVehicle = savedVehicles.find((item) => item.id === vehicleId);
      if (!targetVehicle) return;

      setPendingVehicleDeletion({
        id: targetVehicle.id,
        label: `${targetVehicle.year} ${targetVehicle.make} ${targetVehicle.model}`,
      });
    },
    [savedVehicles]
  );

  const closeDeleteVehicleModal = useCallback((): void => {
    if (deletingVehicleId) return;
    setPendingVehicleDeletion(null);
  }, [deletingVehicleId]);

  const confirmDeleteVehicle = useCallback((): void => {
    if (!pendingVehicleDeletion) return;
    const vehicleId = pendingVehicleDeletion.id;

    void (async () => {
      await deleteVehicle(vehicleId);
      setPendingVehicleDeletion(null);
    })();
  }, [deleteVehicle, pendingVehicleDeletion]);

  const handleDeleteVehicle = (vehicleId: string): void => {
    requestDeleteVehicle(vehicleId);
  };

  const handleSectionChange = useCallback(
    (nextSection: ProfileSection): void => {
      if (nextSection === activeSection) return;

      const currentIndex = PROFILE_SECTION_ORDER.indexOf(activeSection);
      const nextIndex = PROFILE_SECTION_ORDER.indexOf(nextSection);
      setTabTransitionDirection(nextIndex > currentIndex ? 1 : -1);
      setActiveSection(nextSection);
    },
    [activeSection]
  );

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

        <View
          style={styles.profileTabsBar}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            if (nextWidth > 0 && nextWidth !== tabsBarWidth) {
              setTabsBarWidth(nextWidth);
            }
          }}
        >
          {tabsBarWidth > 0 ? (
            <RNAnimated.View
              style={[
                styles.profileTabIndicator,
                {
                  width: tabIndicatorWidth,
                  transform: [{ translateX: tabIndicatorTranslateX }],
                },
              ]}
            />
          ) : null}

          {PROFILE_SECTION_ORDER.map((section) => {
            const focused = section === activeSection;
            const accessibilityLabel =
              section === 'vehicles'
                ? 'Vehicles'
                : section === 'posts'
                  ? 'Posts'
                  : 'Favorites';

            return (
              <Pressable
                key={section}
                onPress={() => handleSectionChange(section)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                style={({ pressed }) => [styles.profileTab, pressed && styles.buttonPressed]}
              >
                <View style={[styles.profileTabIconWrap, focused && styles.profileTabIconWrapActive]}>
                  <ProfileSectionIcon section={section} focused={focused} />
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sectionDivider} />

        <Reanimated.View
          key={activeSection}
          entering={
            tabTransitionDirection === 1
              ? SlideInRight.duration(220)
              : SlideInLeft.duration(220)
          }
          exiting={
            tabTransitionDirection === 1
              ? SlideOutLeft.duration(220)
              : SlideOutRight.duration(220)
          }
          style={styles.sectionAnimatedContainer}
        >
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

              {isInitialGarageLoading ? (
                <View style={styles.inlineRow}>
                  <ActivityIndicator color={theme.colors.accentGreen} />
                  <Text style={styles.inlineText}>Loading your garage...</Text>
                </View>
              ) : showGarageLoadError ? (
                <View style={styles.garageErrorState}>
                  <View style={styles.inlineRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={theme.colors.textDanger}
                    />
                    <Text style={styles.errorTextCompact}>{savedVehiclesError}</Text>
                  </View>
                  <Pressable
                    onPress={() => void refreshGarage()}
                    style={({ pressed }) => [
                      styles.garageRetryButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.garageRetryButtonText}>Retry Garage Load</Text>
                  </Pressable>
                </View>
              ) : activeVehicle ? (
                <>
                  <View style={styles.savedVehiclesSection}>
                    <View style={styles.savedVehiclesHeaderRow}>
                      <Text style={styles.savedVehiclesTitle}>Your vehicles</Text>
                      {switchingVehicleId ? (
                        <View style={styles.savedVehiclesUpdatingRow}>
                          <ActivityIndicator size="small" color={theme.colors.accentGreenMuted} />
                          <Text style={styles.savedVehiclesUpdatingText}>Updating...</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.savedVehiclesList}>
                      {orderedVehicles.map((vehicle) => {
                        const isPrimaryVehicle = vehicle.id === primaryVehicle?.id;
                        const isActiveVehicle = vehicle.id === activeVehicle?.id;
                        const isSwitchingThisVehicle = switchingVehicleId === vehicle.id;
                        const isDeleteInProgress = deletingVehicleId === vehicle.id;
                        const switchDisabled =
                          isActiveVehicle ||
                          savingVehicle ||
                          Boolean(switchingVehicleId) ||
                          Boolean(deletingVehicleId);
                        const deleteDisabled =
                          orderedVehicles.length <= 1 ||
                          savingVehicle ||
                          Boolean(switchingVehicleId) ||
                          Boolean(deletingVehicleId);

                        return (
                          <Reanimated.View
                            key={vehicle.id}
                            layout={VEHICLE_CARD_LAYOUT_TRANSITION}
                            style={[
                              styles.savedVehicleCard,
                              isActiveVehicle && styles.savedVehicleCardPrimary,
                            ]}
                          >
                            <View style={styles.savedVehicleRow}>
                              <Text style={styles.savedVehicleName}>
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </Text>
                              {isActiveVehicle ? (
                                <View style={styles.savedVehiclePrimaryBadge}>
                                  <Text style={styles.savedVehiclePrimaryBadgeText}>
                                    {isPrimaryVehicle ? 'Primary' : 'Active'}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={styles.savedVehicleActionsRow}>
                              <Pressable
                                onPress={() => handleSelectVehicle(vehicle.id)}
                                disabled={switchDisabled}
                                style={({ pressed }) => [
                                  styles.savedVehicleSwitchButton,
                                  switchDisabled && styles.savedVehicleSwitchButtonDisabled,
                                  pressed && !switchDisabled && styles.buttonPressed,
                                ]}
                              >
                                {isSwitchingThisVehicle ? (
                                  <ActivityIndicator size="small" color={theme.colors.textInverse} />
                                ) : (
                                  <Text style={styles.savedVehicleSwitchButtonText}>
                                    {isActiveVehicle ? 'Active' : 'Set active'}
                                  </Text>
                                )}
                              </Pressable>

                              <Pressable
                                onPress={() => handleDeleteVehicle(vehicle.id)}
                                disabled={deleteDisabled}
                                style={({ pressed }) => [
                                  styles.savedVehicleDeleteButton,
                                  deleteDisabled && styles.savedVehicleDeleteButtonDisabled,
                                  pressed && !deleteDisabled && styles.buttonPressed,
                                ]}
                              >
                                {isDeleteInProgress ? (
                                  <ActivityIndicator size="small" color={theme.colors.textInverse} />
                                ) : (
                                  <Ionicons name="trash-outline" size={16} color={theme.colors.textInverse} />
                                )}
                              </Pressable>
                            </View>
                          </Reanimated.View>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.emptyVehicleState}>
                  <Ionicons name="car-outline" size={18} color={theme.colors.accentGreenMuted} />
                  <View style={styles.emptyVehicleStateCopy}>
                    <Text style={styles.emptyVehicleStateText}>
                      Add your first vehicle from Manage Vehicle below.
                    </Text>
                    <Pressable
                      onPress={() => setManageVehicleExpanded(true)}
                      style={({ pressed }) => [
                        styles.emptyVehicleActionButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.emptyVehicleActionButtonText}>Start Vehicle Setup</Text>
                    </Pressable>
                  </View>
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
                        <RNAnimated.View
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
                        </RNAnimated.View>
                      ) : null}
                    </View>
                  </Pressable>

                  {error ? (
                    <View style={styles.manageErrorBlock}>
                      <Text style={styles.errorText}>{error}</Text>
                      <Pressable
                        onPress={() => void refreshGarage()}
                        disabled={savingVehicle || Boolean(switchingVehicleId) || Boolean(deletingVehicleId)}
                        style={({ pressed }) => [
                          styles.manageErrorRetryButton,
                          (savingVehicle || Boolean(switchingVehicleId) || Boolean(deletingVehicleId)) &&
                            styles.manageErrorRetryButtonDisabled,
                          pressed &&
                            !savingVehicle &&
                            !switchingVehicleId &&
                            !deletingVehicleId &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.manageErrorRetryButtonText}>Retry Sync</Text>
                      </Pressable>
                    </View>
                  ) : null}

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
        </Reanimated.View>

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
                        disabled={Boolean(deletingVehicleId) || savingVehicle}
                        onPress={() => {
                          activeDropdown.onSelect(option.value);
                          closeDropdown();
                        }}
                        style={({ pressed }) => [
                          styles.modalOption,
                          isSelected && styles.modalOptionSelected,
                          pressed && !deletingVehicleId && !savingVehicle && styles.buttonPressed,
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
                            disabled={Boolean(deletingVehicleId) || savingVehicle}
                            style={({ pressed }) => [
                              styles.modalDeleteAction,
                              pressed && !deletingVehicleId && !savingVehicle && styles.buttonPressed,
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
        visible={pendingVehicleDeletion !== null}
        onRequestClose={closeDeleteVehicleModal}
      >
        <View style={styles.deleteModalContainer}>
          <Pressable style={styles.deleteModalBackdrop} onPress={closeDeleteVehicleModal} />
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Delete Vehicle?</Text>
            <Text style={styles.deleteModalBody}>
              {pendingVehicleDeletion
                ? `${pendingVehicleDeletion.label} will be removed from your garage.`
                : 'This vehicle will be removed from your garage.'}
            </Text>
            <Text style={styles.deleteModalNote}>This action cannot be undone.</Text>

            <Pressable
              onPress={confirmDeleteVehicle}
              disabled={!pendingVehicleDeletion || Boolean(deletingVehicleId)}
              style={({ pressed }) => [
                styles.deleteModalPrimaryButton,
                (!pendingVehicleDeletion || Boolean(deletingVehicleId)) &&
                  styles.deleteModalPrimaryButtonDisabled,
                pressed &&
                  pendingVehicleDeletion &&
                  !deletingVehicleId &&
                  styles.buttonPressed,
              ]}
            >
              {pendingVehicleDeletion && deletingVehicleId === pendingVehicleDeletion.id ? (
                <ActivityIndicator size="small" color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.deleteModalPrimaryText}>Delete Vehicle</Text>
              )}
            </Pressable>

            <Pressable
              onPress={closeDeleteVehicleModal}
              disabled={Boolean(deletingVehicleId)}
              style={({ pressed }) => [
                styles.deleteModalSecondaryButton,
                deletingVehicleId && styles.deleteModalSecondaryButtonDisabled,
                pressed && !deletingVehicleId && styles.buttonPressed,
              ]}
            >
              <Text style={styles.deleteModalSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
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
    position: 'relative',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderDefault,
    minHeight: 44,
    marginBottom: 2,
  },
  profileTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.accentGreen,
  },
  profileTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTabIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTabIconWrapActive: {
    transform: [{ scale: 1.08 }],
  },
  sectionDivider: {
    height: 10,
  },
  sectionAnimatedContainer: {
    minHeight: 200,
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
  savedVehiclesSection: {
    marginBottom: 14,
  },
  savedVehiclesHeaderRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  savedVehiclesTitle: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  savedVehiclesUpdatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedVehiclesUpdatingText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  savedVehiclesList: {
    gap: 8,
  },
  savedVehicleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  savedVehicleCardPrimary: {
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
  },
  savedVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  savedVehicleName: {
    flex: 1,
    color: theme.colors.accentGreen,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  savedVehiclePrimaryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrandSoft,
  },
  savedVehiclePrimaryBadgeText: {
    color: theme.colors.accentGreenMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  savedVehicleActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedVehicleSwitchButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedVehicleSwitchButtonDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  savedVehicleSwitchButtonText: {
    color: theme.colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  savedVehicleDeleteButton: {
    width: 40,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.textDanger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedVehicleDeleteButtonDisabled: {
    opacity: 0.5,
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
  emptyVehicleStateCopy: {
    flex: 1,
  },
  emptyVehicleStateText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyVehicleActionButton: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  emptyVehicleActionButtonText: {
    color: theme.colors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
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
  manageErrorBlock: {
    marginTop: 2,
  },
  manageErrorRetryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  manageErrorRetryButtonDisabled: {
    opacity: 0.6,
  },
  manageErrorRetryButtonText: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
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
  garageErrorState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorTextCompact: {
    flex: 1,
    color: theme.colors.textDanger,
    fontSize: 14,
    lineHeight: 20,
  },
  garageRetryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.surfaceBrand,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  garageRetryButtonText: {
    color: theme.colors.accentGreen,
    fontSize: 13,
    fontWeight: '700',
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
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  deleteModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfaceOverlay,
  },
  deleteModalCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surface,
    padding: 18,
  },
  deleteModalTitle: {
    color: theme.colors.accentGreen,
    fontSize: 20,
    fontWeight: '700',
  },
  deleteModalBody: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteModalNote: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteModalPrimaryButton: {
    marginTop: 14,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.textDanger,
  },
  deleteModalPrimaryButtonDisabled: {
    opacity: 0.65,
  },
  deleteModalPrimaryText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteModalSecondaryButton: {
    marginTop: 8,
    borderRadius: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.surfaceMuted,
  },
  deleteModalSecondaryButtonDisabled: {
    opacity: 0.6,
  },
  deleteModalSecondaryText: {
    color: theme.colors.textSubtle,
    fontSize: 14,
    fontWeight: '600',
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
