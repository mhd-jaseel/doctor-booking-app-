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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { APP_NAME } from '../../constants/app';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';
import { FormFieldError } from '../../components/common/FormFieldError';
import { getErrorMessage } from '../../utils/errorHandler';
import { isValidEmail } from '../../utils/validation';

const LOGO_IMAGE = require('../../assets/branding/doctorcare-logo.jpg');

export const LoginScreen = ({ navigation, route }) => {
  const { login } = useAuth();
  const { showWarning } = useAppAlert();
  const { submit, submitting } = useSubmit('Welcome', 'Login Failed');
  const { pendingBooking, pendingWaitingList, returnScreen, returnParams } = route.params || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    await submit({
      action: () => login(email.trim(), password),
      silentSuccess: true,
      onSuccess: (loggedInUser) => {
        if (loggedInUser.role === 'admin') {
          // Admin logged in via User Login screen.
          // The AuthContext state change (isAdmin=true) will automatically
          // switch the RootNavigator to the Admin Stack.
          // Do NOT call navigation.replace('AdminDashboard') — that route
          // does not exist in the User Stack and would cause a REPLACE error.
          // No manual navigation needed; RootNavigator handles it.
          return;
        }

        // Normal user login — navigate within the User Stack
        try {
          if (pendingBooking) {
            // Navigate to MainTabs first, then into the nested PatientDetails tab screen
            navigation.replace('MainTabs', {
              screen: 'PatientDetails',
              params: {
                doctor: pendingBooking.doctor,
                schedule: pendingBooking.schedule,
                session: pendingBooking.session,
                tokenNumber: pendingBooking.tokenNumber,
              },
            });
          } else if (pendingWaitingList) {
            navigation.replace('MainTabs', {
              screen: 'BookSlot',
              params: { doctorId: pendingWaitingList.doctor },
            });
          } else if (returnScreen) {
            // Safety: verify the return screen is accessible via MainTabs
            navigation.replace('MainTabs', {
              screen: returnScreen,
              params: returnParams || {},
            });
          } else {
            navigation.replace('MainTabs');
          }
        } catch (navError) {
          // Fallback: if any navigation issue, go to MainTabs safely
          console.warn('[LoginScreen] Navigation fallback:', navError.message);
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
          showError(getErrorMessage(err), 'Login Failed');
        }
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.headerBox}>
          <Image source={LOGO_IMAGE} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.nameRow}>
            <Text style={styles.nameDoctor}>Doctor</Text>
            <Text style={styles.nameCare}>Care</Text>
          </View>
          <Text style={styles.appSubtitle}>Sign in to schedule your doctor appointments</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={(val) => { setEmail(val); if(errors.email) setErrors({...errors, email: null}) }}
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
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={(val) => { setPassword(val); if(errors.password) setErrors({...errors, password: null}) }}
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

          {errors.general && (
            <FormFieldError error={errors.general} style={{ marginTop: 8 }} />
          )}

          <AppButton
            title="Sign In"
            loadingTitle="Signing in..."
            loading={submitting}
            onPress={handleLogin}
            size="lg"
            style={{ width: '100%', marginTop: 8 }}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Register', {
                  pendingBooking,
                  pendingWaitingList,
                  returnScreen,
                  returnParams,
                })
              }
            >
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* If navigated with a pending booking or back action, provide a Back button */}
          {(pendingBooking || returnScreen || pendingWaitingList) && (
            <TouchableOpacity
              style={styles.cancelReturnBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
              <Text style={styles.cancelReturnText}>Back to Browsing</Text>
            </TouchableOpacity>
          )}

          <View style={styles.adminLinkRow}>
            <TouchableOpacity
              style={styles.adminLinkBtn}
              onPress={() => navigation.navigate('AdminLogin')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.adminLinkText}>Admin Portal Access</Text>
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
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  nameDoctor: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  nameCare: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#DCE6FC',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cancelReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
    gap: 6,
  },
  cancelReturnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  adminLinkRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  adminLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  adminLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
