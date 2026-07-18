import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NhtsaMake, NhtsaModel } from '../../lib/nhtsa';
import { theme } from '../../lib/theme';

type VehicleSetupFormProps = {
  year: string;
  yearOptions: string[];
  makes: NhtsaMake[];
  models: NhtsaModel[];
  selectedMakeId: number | null;
  selectedModelId: number | null;
  loadingMakes: boolean;
  loadingModels: boolean;
  actionLabel: string;
  actionEnabled: boolean;
  actionBusy: boolean;
  onYearChange: (value: string) => void;
  onMakeChange: (value: number | null) => void;
  onModelChange: (value: number | null) => void;
  onSubmit: () => void;
};

export function VehicleSetupForm({
  year,
  yearOptions,
  makes,
  models,
  selectedMakeId,
  selectedModelId,
  loadingMakes,
  loadingModels,
  actionLabel,
  actionEnabled,
  actionBusy,
  onYearChange,
  onMakeChange,
  onModelChange,
  onSubmit,
}: VehicleSetupFormProps) {
  return (
    <View>
      <PickerField label="Model Year">
        <Picker
          selectedValue={year}
          onValueChange={(value: string) => onYearChange(value)}
          dropdownIconColor={theme.colors.accentGreenMuted}
          style={styles.picker}
        >
          <Picker.Item label="Select year" value="" color={theme.colors.textMuted} />
          {yearOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </PickerField>

      <PickerField label="Make" status={loadingMakes ? 'Loading makes…' : undefined}>
        <Picker
          selectedValue={selectedMakeId ?? 0}
          enabled={year.length === 4 && !loadingMakes}
          onValueChange={(value: number) => onMakeChange(value > 0 ? value : null)}
          dropdownIconColor={theme.colors.accentGreenMuted}
          style={styles.picker}
        >
          <Picker.Item
            label={year.length === 4 ? 'Select make' : 'Select year first'}
            value={0}
            color={theme.colors.textMuted}
          />
          {makes.map((make) => (
            <Picker.Item key={make.makeId} label={make.makeName} value={make.makeId} />
          ))}
        </Picker>
      </PickerField>

      <PickerField label="Model" status={loadingModels ? 'Loading models…' : undefined}>
        <Picker
          selectedValue={selectedModelId ?? 0}
          enabled={Boolean(selectedMakeId) && !loadingModels}
          onValueChange={(value: number) => onModelChange(value > 0 ? value : null)}
          dropdownIconColor={theme.colors.accentGreenMuted}
          style={styles.picker}
        >
          <Picker.Item
            label={selectedMakeId ? 'Select model' : 'Select make first'}
            value={0}
            color={theme.colors.textMuted}
          />
          {models.map((model) => (
            <Picker.Item key={model.modelId} label={model.modelName} value={model.modelId} />
          ))}
        </Picker>
      </PickerField>

      <Pressable
        onPress={onSubmit}
        disabled={!actionEnabled}
        style={({ pressed }) => [
          styles.action,
          !actionEnabled && styles.actionDisabled,
          pressed && actionEnabled && styles.pressed,
        ]}
      >
        {actionBusy ? (
          <ActivityIndicator color={theme.colors.textInverse} />
        ) : (
          <Text style={styles.actionText}>{actionLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

type PickerFieldProps = {
  label: string;
  status?: string;
  children: React.ReactNode;
};

function PickerField({ label, status, children }: PickerFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
      <View style={styles.pickerFrame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  labelRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    marginLeft: 2,
    color: theme.colors.accentGreenMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  status: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  pickerFrame: {
    marginTop: 6,
    minHeight: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.surfaceMuted,
  },
  picker: {
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceMuted,
  },
  action: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderBrand,
    backgroundColor: theme.colors.buttonPrimary,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
