import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../constants/theme';
import { APP_NAME } from '../../constants/app';
import { notificationService } from '../../services';
import { useAuth } from '../../context/AuthContext';

/**
 * Global Reusable User Top Navbar
 * Displays DoctorCare on the left and Notification Bell on the right.
 */
export const UserNavbar = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setUnreadCount(0);
        return;
      }

      const checkUnread = async () => {
        try {
          const res = await notificationService.getNotifications({ status: 'unread', limit: 1 });
          const count = res?.data?.pagination?.totalItems || res?.pagination?.totalItems || 0;
          setUnreadCount(count);
        } catch (e) {
          // quiet catch
        }
      };

      checkUnread();
    }, [isAuthenticated, user?._id])
  );

  const handleNotificationPress = () => {
    setUnreadCount(0);
    navigation.navigate('Notifications');
  };

  return (
    <View
      style={[
        styles.navbar,
        {
          paddingTop: Math.max(insets.top, 8),
          height: 60 + Math.max(insets.top, 8),
        },
      ]}
    >
      {/* Brand Title */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>{APP_NAME}</Text>
      </View>

      {/* Notification Bell Button with Indicator */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={handleNotificationPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
        {unreadCount > 0 && <View style={styles.badgeDot} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.subtle,
    zIndex: 100,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  bellButton: {
    padding: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.notAvailable,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
});
