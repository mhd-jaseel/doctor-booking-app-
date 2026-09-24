import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppButton } from '../../components/common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const PatientDetailsScreen = ({ navigation, route }) => {
  const { doctor, schedule, session, tokenNumber } = route.params || {};

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male'); // 'male' | 'female' | 'other'
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Patient full name is required';
    }
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      errs.age = 'Enter a valid age between 1 and 120';
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!phone || cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceed = () => {
    if (!validateForm()) return;

    navigation.navigate('AppointmentConfirm', {
      doctor,
      schedule,
      session,
      tokenNumber,
      patient: {
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
        phone: phone.trim(),
      },
    });
  };

  return (
    <UserLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Form Header with Back Button */}
          <View style={styles.formHeaderRow}>
            <TouchableOpacity style={styles.backBtnCircle} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.formNavTitle}>Patient Details</Text>
          </View>

          {/* Token Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenNum}>#{tokenNumber}</Text>
            <Text style={styles.tokenLabel}>TOKEN</Text>
          </View>
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryDocName}>{doctor?.name}</Text>
            <Text style={styles.summaryDate}>Date: {schedule?.date}</Text>
            <Text style={styles.summaryHours}>
              Hours: {schedule?.startTime || '10:00 AM'} - {schedule?.endTime || '01:00 PM'}
            </Text>
          </View>
        </View>

        {/* Patient Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enter Patient Information</Text>
          <Text style={styles.formSubtitle}>Details of person attending the consultation</Text>

          {/* Full Name */}
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Connor"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          {/* Age */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Age *</Text>
          <View style={[styles.inputWrapper, errors.age && styles.inputError]}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. 28"
              placeholderTextColor={COLORS.textMuted}
              value={age}
              onChangeText={(text) => {
                setAge(text);
                if (errors.age) setErrors((prev) => ({ ...prev, age: null }));
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

          {/* Gender */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Gender *</Text>
          <View style={styles.genderRow}>
            {['male', 'female', 'other'].map((g) => {
              const isSelected = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, isSelected && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                    {g.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Phone Number */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Phone Number *</Text>
          <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
              }}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          {/* Continue Action */}
          <AppButton
            title="Review & Confirm Appointment"
            onPress={handleProceed}
            size="lg"
            icon={<Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
            style={{ marginTop: 14 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  backBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  formNavTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.subtle,
  },
  tokenBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tokenNum: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0E7FF',
  },
  summaryDetails: {
    marginLeft: 14,
    flex: 1,
  },
  summaryDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  summaryHours: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FAFCFF',
  },
  inputError: {
    borderColor: COLORS.notAvailable,
    backgroundColor: '#FEF2F2',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.notAvailable,
    fontWeight: '600',
    marginTop: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
  },
  genderBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySubtle,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  genderTextActive: {
    color: COLORS.primary,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});
