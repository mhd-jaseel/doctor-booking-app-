import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ImageUploadField } from '../common/ImageUploadField';
import { AppButton } from '../../common/AppButton';
import { FormFieldError } from '../../common/FormFieldError';
import { COLORS, RADIUS } from '../../../constants/theme';

export const DoctorForm = ({ form, errors = {}, onChange, onSave, onCancel, saving = false }) => {
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  return (
    <ScrollView style={{ maxHeight: 450 }}>
      {/* Doctor Image Upload / Preview */}
      <ImageUploadField
        label="Doctor Image"
        imageUrl={form.image}
        imageFileId={form.imageFileId}
        fallbackType="doctor"
        gender={form.gender || 'male'}
        onUploadStateChange={setIsUploadingImage}
        onChange={({ image, imageFileId }) => onChange({ ...form, image, imageFileId })}
      />

      <Text style={styles.label}>Doctor Name *</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => onChange({ ...form, name: v })}
        placeholder="Dr. Full Name"
      />
      <FormFieldError error={errors.name} />

      <Text style={styles.label}>Gender *</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <TouchableOpacity
          style={[styles.pill, (form.gender || 'male') === 'male' && styles.pillActive]}
          onPress={() => onChange({ ...form, gender: 'male' })}
        >
          <Text style={[styles.pillText, (form.gender || 'male') === 'male' && styles.pillTextActive]}>
            Male Doctor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, form.gender === 'female' && styles.pillActive]}
          onPress={() => onChange({ ...form, gender: 'female' })}
        >
          <Text style={[styles.pillText, form.gender === 'female' && styles.pillTextActive]}>
            Female Doctor
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Specialization *</Text>
      <TextInput
        style={[styles.input, errors.specialization && styles.inputError]}
        value={form.specialization}
        onChangeText={(v) => onChange({ ...form, specialization: v })}
        placeholder="e.g. GENERAL MEDICINE"
      />
      <FormFieldError error={errors.specialization} />

      <Text style={styles.label}>Qualification *</Text>
      <TextInput
        style={[styles.input, errors.qualification && styles.inputError]}
        value={form.qualification}
        onChangeText={(v) => onChange({ ...form, qualification: v })}
        placeholder="MBBS, MD"
      />
      <FormFieldError error={errors.qualification} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Experience (Yrs) *</Text>
          <TextInput
            style={[styles.input, errors.experience && styles.inputError]}
            value={form.experience}
            onChangeText={(v) => onChange({ ...form, experience: v })}
            placeholder="5"
            keyboardType="numeric"
          />
          <FormFieldError error={errors.experience} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Base Fee (₹) *</Text>
          <TextInput
            style={[styles.input, errors.consultationFee && styles.inputError]}
            value={form.consultationFee}
            onChangeText={(v) => onChange({ ...form, consultationFee: v })}
            placeholder="350"
            keyboardType="numeric"
          />
          <FormFieldError error={errors.consultationFee} />
        </View>
      </View>

      <Text style={styles.label}>About Doctor</Text>
      <TextInput
        style={[styles.input, { height: 60 }]}
        multiline
        value={form.about}
        onChangeText={(v) => onChange({ ...form, about: v })}
        placeholder="Brief biography"
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
          title="Save Doctor"
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
  },
  pillActive: { backgroundColor: COLORS.primarySubtle, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primary, fontWeight: '800' },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#CBD5E1' },
  cancelText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md },
  saveText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
});
