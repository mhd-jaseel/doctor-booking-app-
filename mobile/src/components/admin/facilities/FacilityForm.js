import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ImageUploadField } from '../common/ImageUploadField';
import { AppButton } from '../../common/AppButton';
import { FormFieldError } from '../../common/FormFieldError';
import { COLORS, RADIUS } from '../../../constants/theme';

const FACILITY_TYPES = [
  { id: 'hospital', label: 'Hospital' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'medical_college', label: 'Medical College' },
  { id: 'speciality_centre', label: 'Speciality Centre' },
  { id: 'polyclinic', label: 'Polyclinic' },
  { id: 'diagnostic_centre', label: 'Diagnostic Centre' },
  { id: 'health_centre', label: 'Health Centre' },
];

export const FacilityForm = ({ form, errors = {}, onChange, onSave, onCancel, saving = false }) => {
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  return (
    <ScrollView style={{ maxHeight: 450 }}>
      {/* Facility Image Upload / Preview */}
      <ImageUploadField
        label="Facility Image"
        imageUrl={form.image}
        imageFileId={form.imageFileId}
        fallbackType="facility"
        onUploadStateChange={setIsUploadingImage}
        onChange={({ image, imageFileId }) => onChange({ ...form, image, imageFileId })}
      />

      <Text style={styles.label}>Facility Name *</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => onChange({ ...form, name: v })}
        placeholder="e.g. Metro Care Hospital"
      />
      <FormFieldError error={errors.name} />

      <Text style={styles.label}>Facility Type *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        {FACILITY_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.pill, form.facilityType === opt.id && styles.pillActive]}
            onPress={() => onChange({ ...form, facilityType: opt.id })}
          >
            <Text style={[styles.pillText, form.facilityType === opt.id && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FormFieldError error={errors.facilityType} />

      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={[styles.input, errors.address && styles.inputError]}
        value={form.address}
        onChangeText={(v) => onChange({ ...form, address: v })}
        placeholder="Address line"
      />
      <FormFieldError error={errors.address} />

      <Text style={styles.label}>City *</Text>
      <TextInput
        style={[styles.input, errors.city && styles.inputError]}
        value={form.city}
        onChangeText={(v) => onChange({ ...form, city: v })}
        placeholder="City"
      />
      <FormFieldError error={errors.city} />

      <Text style={styles.label}>Phone *</Text>
      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        value={form.phone}
        onChangeText={(v) => onChange({ ...form, phone: v })}
        placeholder="+91 494 2608222"
      />
      <FormFieldError error={errors.phone} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={form.email}
        onChangeText={(v) => onChange({ ...form, email: v })}
        placeholder="contact@facility.org"
      />
      <FormFieldError error={errors.email} />

      <Text style={styles.label}>Working Hours</Text>
      <TextInput
        style={styles.input}
        value={form.workingHours}
        onChangeText={(v) => onChange({ ...form, workingHours: v })}
        placeholder="9:00 AM - 5:00 PM"
      />

      <Text style={styles.label}>Key Facilities (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={form.facilitiesStr}
        onChangeText={(v) => onChange({ ...form, facilitiesStr: v })}
        placeholder="OPD, Emergency, Pharmacy, Lab"
      />

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
          title="Save Facility"
          loadingTitle={isUploadingImage ? "Uploading..." : "Saving..."}
          loading={saving || isUploadingImage}
          disabled={saving || isUploadingImage}
          onPress={onSave}
          size="sm"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, marginTop: 8 },
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
  pill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
  },
  pillActive: { backgroundColor: COLORS.primarySubtle, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primary, fontWeight: '800' },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
});
