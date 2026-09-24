import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';
import { getErrorMessage } from '../../utils/errorHandler';
import { FormFieldError } from '../../components/common/FormFieldError';
import { isValidEmail } from '../../utils/validation';

export const RegisterScreen = ({ navigation, route }) => {
  const { login } = useAuth();
  const { showSuccess, showWarning } = useAppAlert();
  const { submit, submitting } = useSubmit('Account Created', 'Registration Failed');
  const { pendingBooking, pendingWaitingList, returnScreen, returnParams } = route.params || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    await submit({
      action: async () => {
        await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        // Automatically log the newly registered user in
        return await login(email.trim(), password);
      },
      silentSuccess: true,
      onSuccess: () => {
        try {
          if (pendingBooking) {
            showSuccess(
              'Your account has been created! Continuing to your appointment details...',
              'Welcome to DoctorCare',
              () => {
                try {
                  navigation.replace('MainTabs', {
                    screen: 'PatientDetails',
                    params: {
                      doctor: pendingBooking.doctor,
                      schedule: pendingBooking.schedule,
                      session: pendingBooking.session,
                      tokenNumber: pendingBooking.tokenNumber,
                    },
                  });
                } catch (_) {
                  navigation.replace('MainTabs');
                }
              }
            );
          } else if (pendingWaitingList) {
            navigation.replace('MainTabs', {
              screen: 'BookSlot',
              params: { doctorId: pendingWaitingList.doctor },
            });
          } else if (returnScreen) {
            navigation.replace('MainTabs', {
              screen: returnScreen,
              params: returnParams || {},
            });
          } else {
            navigation.replace('MainTabs');
          }
        } catch (navError) {
          console.warn('[RegisterScreen] Navigation fallback:', navError.message);
          try {
            navigation.replace('MainTabs');
          } catch (_) {
            // RootNavigator state-driven rendering will handle it
          }
        }
      },
      onError: (err) => {
        const errorData = err.response?.data;
        if (errorData?.errors) {
          setErrors(errorData.errors);
        } else {
          showError(getErrorMessage(err), 'Registration Failed');
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.headerBox}>
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.appSubtitle}>Register to book appointments with doctors & clinics</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
            <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Mohammed Jaseel"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(val) => { setName(val); if (errors.name) setErrors({...errors, name: null}) }}
            />
          </View>
          <FormFieldError error={errors.name} />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(val) => { setEmail(val); if (errors.email) setErrors({...errors, email: null}) }}
              onBlur={() => {
                if (email && !isValidEmail(email)) {
                  setErrors({...errors, email: 'Please enter a valid email address.'});
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <FormFieldError error={errors.email} />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(val) => { setPassword(val); if (errors.password) setErrors({...errors, password: null}) }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
          <FormFieldError error={errors.password} />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Confirm Password</Text>
          <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={(val) => { setConfirmPassword(val); if (errors.confirmPassword) setErrors({...errors, confirmPassword: null}) }}
              secureTextEntry={!showPassword}
            />
          </View>
          <FormFieldError error={errors.confirmPassword} />

          {errors.general && (
            <FormFieldError error={errors.general} style={{ marginTop: 8 }} />
          )}

          <AppButton
            title="Register"
            loadingTitle="Creating account..."
            loading={submitting}
            onPress={handleRegister}
            size="lg"
            style={{ width: '100%', marginTop: 8 }}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Login', {
                  pendingBooking,
                  pendingWaitingList,
                  returnScreen,
                  returnParams,
                })
              }
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.subtle,
  },
  headerBox: {
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  appSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  inputLabel: {
    fontSize: 13,
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
    height: 48,
    backgroundColor: '#FAFCFF',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginPrompt: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
