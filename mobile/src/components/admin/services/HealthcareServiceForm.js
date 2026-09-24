import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../common/AppButton';
import { FormFieldError } from '../../common/FormFieldError';
import { COLORS, RADIUS } from '../../../constants/theme';

const ICON_PRESETS = [
  { id: 'hospital', label: 'Hospital', icon: 'business' },
  { id: 'clinic', label: 'Clinic', icon: 'medkit' },
  { id: 'apps', label: 'Services', icon: 'apps' },
  { id: 'medical', label: 'Medical', icon: 'medical' },
  { id: 'heart', label: 'Cardiology', icon: 'heart' },
  { id: 'stethoscope', label: 'Pulse/Doctor', icon: 'pulse' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'bandage' },
  { id: 'laboratory', label: 'Lab', icon: 'flask' },
  { id: 'dental', label: 'Dental', icon: 'happy' },
  { id: 'eye', label: 'Eye Care', icon: 'eye' },
  { id: 'child', label: 'Pediatrics', icon: 'people' },
  { id: 'ambulance', label: 'Ambulance', icon: 'car' },
];


export const HealthcareServiceForm = ({
  form,
  errors = {},
  onChange,
  onSave,
  onCancel,
  saving = false,
}) => {
  return (
    <ScrollView style={{ maxHeight: 450 }}>
      <Text style={styles.modalTitle}>
        {form._id ? 'Edit Healthcare Service' : 'Add Healthcare Service'}
      </Text>

      <Text style={styles.label}>Service Name *</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => onChange({ ...form, name: v })}
        placeholder="e.g. Dental Care, Laboratory"
      />
      <FormFieldError error={errors.name} />

      <Text style={styles.label}>Identifier / Slug (Unique) *</Text>
      <TextInput
        style={[styles.input, errors.slug && styles.inputError]}
        value={form.slug}
        onChangeText={(v) => onChange({ ...form, slug: v.toLowerCase().replace(/\s+/g, '-') })}
        placeholder="e.g. dental-care, laboratory"
        autoCapitalize="none"
      />
      <FormFieldError error={errors.slug} />

      <Text style={styles.label}>Select Icon *</Text>
      <View style={styles.iconGrid}>
        {ICON_PRESETS.map((item) => {
          const isSelected = form.icon === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.iconCard, isSelected && styles.iconCardActive]}
              onPress={() => onChange({ ...form, icon: item.id })}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[styles.iconText, isSelected && styles.iconTextActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 60 }]}
        multiline
        value={form.description}
        onChangeText={(v) => onChange({ ...form, description: v })}
        placeholder="Brief description of the service"
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Display Order</Text>
          <TextInput
            style={styles.input}
            value={String(form.displayOrder || '1')}
            onChangeText={(v) => onChange({ ...form, displayOrder: parseInt(v, 10) || 1 })}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Primary Color (Hex)</Text>
          <TextInput
            style={styles.input}
            value={form.color || '#2F65CB'}
            onChangeText={(v) => onChange({ ...form, color: v })}
            placeholder="#2F65CB"
          />
        </View>
      </View>

      {errors.general && <FormFieldError error={errors.general} />}

      <View style={styles.btns}>
        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={saving}
          size="sm"
        />
        <AppButton
          title="Save Service"
          loadingTitle="Saving..."
          loading={saving}
          onPress={onSave}
          size="sm"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    marginBottom: 0,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  iconCard: {
    width: '30.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySubtle,
  },
  iconText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  iconTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
});
