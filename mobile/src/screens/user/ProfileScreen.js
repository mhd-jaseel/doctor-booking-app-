import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';

export const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showAlert, showConfirm, showSuccess } = useAppAlert();

  // Defensive Guard: Admin should never be inside the User Profile screen
  const isRegularUser = isAuthenticated && !isAdmin;

  const handleLogout = () => {
    showConfirm({
      title: 'Sign Out?',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await logout();
          showSuccess('Signed out successfully.');
          navigation.navigate('Login', { returnScreen: 'Profile' });
        } catch (err) {
          console.error('Logout error:', err);
        }
      },
    });
  };

  const handleHelplinePress = () => {
    showAlert({
      type: 'info',
      title: 'Emergency Helpline & Support',
      message: '24/7 Helpline: +91 494 2608222\nEmergency Care: +91 98470 12345\nEmail: support@doctorcare.org',
    });
  };

  return (
    <UserLayout>
      <View style={styles.content}>
        {/* User Profile Card */}
        {isRegularUser ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        ) : (
          <View style={styles.guestProfileCard}>
            <View style={styles.guestAvatarCircle}>
              <Ionicons name="person-outline" size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.guestTitle}>Welcome, Guest</Text>
            <Text style={styles.guestSubtitle}>
              Sign in or create an account to manage your appointments and profile.
            </Text>
            <TouchableOpacity
              style={styles.guestSignInBtn}
              onPress={() => navigation.navigate('Login', { returnScreen: 'Profile' })}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
              <Text style={styles.guestSignInBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Options List */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('History')
                : navigation.navigate('Login', { returnScreen: 'History' })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            <Text style={styles.menuLabel}>My Appointments</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('Notifications')
                : navigation.navigate('Login', { returnScreen: 'Notifications' })
            }
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            <Text style={styles.menuLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleHelplinePress}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.menuLabel}>Emergency Helpline & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button (Only if authenticated) */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.notAvailable} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  guestProfileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  guestAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  guestSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  guestSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  guestSignInBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 24,
    ...SHADOWS.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.notAvailable,
  },
});
