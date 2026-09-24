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
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';
import { getErrorMessage } from '../../utils/errorHandler';
import { FormFieldError } from '../../components/common/FormFieldError';
import { isValidEmail } from '../../utils/validation';

export const AdminLoginScreen = ({ navigation }) => {
  const { login, logout } = useAuth();
  const { showError, showWarning } = useAppAlert();
  const { submit, submitting } = useSubmit('Authenticated', 'Authentication Failed');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Admin email address is required.';
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

  const handleAdminLogin = async () => {
    if (!validateForm()) return;

    await submit({
      action: async () => {
        const loggedInUser = await login(email.trim(), password);

        if (loggedInUser.role !== 'admin') {
          // Non-admin user tried to access Admin Portal.
          // Clear the session immediately so the non-admin user is not left
          // authenticated in a state that would confuse the navigator.
          await logout();
          throw { _isRoleMismatch: true };
        }

        return loggedInUser;
      },
      silentSuccess: true,
      onSuccess: () => {
        // Admin logged in successfully.
        // The AuthContext state change (isAdmin=true) will automatically
        // switch the RootNavigator to the Admin Stack.
        // Do NOT call navigation.replace('AdminDashboard') — that route
        // does not exist in the User Stack and would cause a REPLACE error.
      },
      onError: (err) => {
        if (err._isRoleMismatch) {
          showError(
            'Admin access is required. Please use an authorized administrator account.',
            'Access Restricted'
          );
        } else {
          const errorData = err.response?.data;
          if (errorData?.errors) {
            setErrors(errorData.errors);
          } else {
            showError(getErrorMessage(err), 'Authentication Failed');
          }
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
        {/* Header Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={38} color={COLORS.primary} />
          </View>
          <Text style={styles.appTitle}>Admin Portal</Text>
          <Text style={styles.appSubtitle}>Secure administrative system & facility management</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Admin Email Address</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="admin@healthcare.org"
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
            title="Authenticate as Admin"
            loadingTitle="Signing in..."
            loading={submitting}
            onPress={handleAdminLogin}
            size="lg"
            style={{ width: '100%', marginTop: 8 }}
          />

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.noteText}>
              Only authorized staff with the Administrator role can sign into this portal. Regular patient accounts are not permitted here.
            </Text>
          </View>

          <View style={styles.backToUserRow}>
            <TouchableOpacity
              style={styles.backToUserBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.backToUserText}>Back to User Login</Text>
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
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
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
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 20,
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    lineHeight: 16,
  },
  backToUserRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  backToUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  backToUserText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
