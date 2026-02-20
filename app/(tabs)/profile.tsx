import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useGarageSetup } from '../../hooks/useGarageSetup';

export default function ProfileScreen() {
  const {
    year,
    selectedMake,
    selectedModel,
    loadingMakes,
    loadingModels,
    error,
    canLoadMakes,
    canLoadModels,
    trimmedMakes,
    trimmedModels,
    setYear,
    selectMake,
    selectModel,
    handleLoadMakes,
    handleLoadModels,
  } = useGarageSetup();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Garage Setup</Text>
      <Text style={styles.subtitle}>Add your vehicle using NHTSA data</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Model Year</Text>
        <TextInput
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="e.g. 2019"
          style={styles.input}
        />
        <Pressable
          onPress={handleLoadMakes}
          disabled={!canLoadMakes || loadingMakes}
          style={({ pressed }) => [
            styles.button,
            (!canLoadMakes || loadingMakes) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {loadingMakes ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Load Makes</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Make</Text>
        {trimmedMakes.length === 0 ? (
          <Text style={styles.helper}>Load makes to see options.</Text>
        ) : (
          trimmedMakes.map((make) => (
            <Pressable
              key={make.makeId}
              onPress={() => selectMake(make)}
              style={({ pressed }) => [
                styles.option,
                selectedMake?.makeId === make.makeId && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={styles.optionText}>{make.makeName}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Model</Text>
        <Pressable
          onPress={handleLoadModels}
          disabled={!canLoadModels || loadingModels}
          style={({ pressed }) => [
            styles.buttonSecondary,
            (!canLoadModels || loadingModels) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {loadingModels ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.buttonSecondaryText}>Load Models</Text>
          )}
        </Pressable>
        {trimmedModels.length === 0 ? (
          <Text style={styles.helper}>Select a make to load models.</Text>
        ) : (
          trimmedModels.map((model) => (
            <Pressable
              key={model.modelId}
              onPress={() => selectModel(model)}
              style={({ pressed }) => [
                styles.option,
                selectedModel?.modelId === model.modelId && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={styles.optionText}>{model.modelName}</Text>
            </Pressable>
          ))
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Selected Vehicle</Text>
        <Text style={styles.summaryText}>
          {year && selectedMake && selectedModel
            ? `${year} ${selectedMake.makeName} ${selectedModel.modelName}`
            : 'Select year, make, and model to complete your garage.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  helper: {
    color: '#64748B',
    fontSize: 13,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#DBEAFE',
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionText: {
    color: '#0F172A',
    fontSize: 14,
  },
  error: {
    color: '#B91C1C',
    marginBottom: 12,
  },
  summary: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    color: '#F8FAFC',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
});
