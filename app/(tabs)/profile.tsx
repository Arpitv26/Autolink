import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useGarageSetup } from '../../hooks/useGarageSetup';

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Text style={styles.pageSubtitle}>Manage your account and garage.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.accountEmail}>{user?.email ?? 'Signed-in account'}</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/profile-data')}
            style={({ pressed }) => [styles.dataButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.dataButtonText}>Data & Personal Info</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Garage</Text>
          <Text style={styles.sectionHint}>Your primary vehicle is used across AI, planner, and feed.</Text>

          {loadingSavedVehicles ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator color="#111827" />
              <Text style={styles.inlineText}>Loading saved vehicle...</Text>
            </View>
          ) : primaryVehicle ? (
            <View style={styles.savedVehicleCard}>
              <Text style={styles.savedVehicleLabel}>Saved primary vehicle</Text>
              <Text style={styles.savedVehicleText}>
                {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
              </Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Model Year</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={year} onValueChange={(value) => setYear(String(value))}>
              <Picker.Item label="Select year" value="" />
              {yearOptions.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Make</Text>
          <View style={styles.pickerContainer}>
            <Picker
              enabled={!loadingMakes && year.length === 4}
              selectedValue={selectedMakeId ?? -1}
              onValueChange={(value) => setSelectedMakeId(value === -1 ? null : Number(value))}
            >
              <Picker.Item
                label={loadingMakes ? 'Loading makes...' : 'Select make'}
                value={-1}
              />
              {makes.map((item) => (
                <Picker.Item key={item.makeId} label={item.makeName} value={item.makeId} />
              ))}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Model</Text>
          <View style={styles.pickerContainer}>
            <Picker
              enabled={!loadingModels && selectedMakeId !== null}
              selectedValue={selectedModelId ?? -1}
              onValueChange={(value) => setSelectedModelId(value === -1 ? null : Number(value))}
            >
              <Picker.Item
                label={loadingModels ? 'Loading models...' : 'Select model'}
                value={-1}
              />
              {models.map((item) => (
                <Picker.Item key={item.modelId} label={item.modelName} value={item.modelId} />
              ))}
            </Picker>
          </View>

          <Pressable
            onPress={saveSelectedVehicle}
            disabled={!canSaveVehicle}
            style={({ pressed }) => [
              styles.saveButton,
              !canSaveVehicle && styles.saveButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {savingVehicle ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Vehicle</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <View style={styles.proCard}>
            <Text style={styles.proTitle}>Multiple vehicles (Pro)</Text>
            <Text style={styles.proText}>
              Free plan includes 1 active vehicle. Upgrade to Pro to save and switch between multiple cars.
            </Text>
            <Pressable disabled style={styles.proButtonDisabled}>
              <Text style={styles.proButtonText}>
                {hasFreeVehicleLimitReached ? 'Add another vehicle (Pro)' : 'Unlock Pro vehicles'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0F172A',
  },
  pageSubtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionHint: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    marginBottom: 10,
  },
  accountEmail: {
    marginTop: 6,
    color: '#334155',
    fontSize: 13,
    marginBottom: 10,
  },
  dataButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dataButtonText: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9E1EC',
    marginVertical: 16,
  },
  savedVehicleCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  savedVehicleLabel: {
    color: '#3730A3',
    fontSize: 12,
    fontWeight: '600',
  },
  savedVehicleText: {
    color: '#0F172A',
    marginTop: 2,
    fontSize: 14,
  },
  inputLabel: {
    marginTop: 6,
    marginBottom: 6,
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 6,
    backgroundColor: '#0B132B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 13,
  },
  successText: {
    marginTop: 10,
    color: '#166534',
    fontSize: 13,
  },
  proCard: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  proTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  proText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  proButtonDisabled: {
    marginTop: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineText: {
    marginLeft: 8,
    color: '#334155',
    fontSize: 13,
  },
});
