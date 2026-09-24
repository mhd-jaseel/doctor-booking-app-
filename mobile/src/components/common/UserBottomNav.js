import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export const UserBottomNav = ({ state, descriptors, navigation, currentRouteName }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  // If custom currentRouteName is passed or extracted from navigation state
  const activeRoute = currentRouteName || (state ? state.routes[state.index]?.name : 'Home');

  // Map sub-routes/child screens to their parent tab section for intelligent active highlighting
  const getActiveTab = (route) => {
    if (!route) return 'Home';
    if (['History'].includes(route)) return 'History';
    if (['Profile', 'Login'].includes(route)) return isAuthenticated ? 'Profile' : 'Login';
    // All browsing, facility, doctor, booking, confirmation, notifications default to Home tab active state
    return 'Home';
  };

  const activeTab = getActiveTab(activeRoute);

  const tabs = [
    {
      name: 'Home',
      label: 'Home',
      iconFocused: 'home',
      iconUnfocused: 'home-outline',
      onPress: () => navigation.navigate('Home'),
    },
    {
      name: 'History',
      label: 'My Tokens',
      iconFocused: 'checkbox',
      iconUnfocused: 'checkbox-outline',
      onPress: () => navigation.navigate('History'),
    },
    isAuthenticated
      ? {
          name: 'Profile',
          label: 'Profile',
          iconFocused: 'person',
          iconUnfocused: 'person-outline',
          onPress: () => navigation.navigate('Profile'),
        }
      : {
          name: 'Login',
          label: 'Login',
          iconFocused: 'log-in',
          iconUnfocused: 'log-in-outline',
          onPress: () => navigation.navigate('Login'),
        },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8),
          height: 60 + Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.name;
        const color = isFocused ? COLORS.primary : COLORS.textMuted;
        const iconName = isFocused ? tab.iconFocused : tab.iconUnfocused;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={tab.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={iconName} size={22} color={color} style={styles.icon} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 6,
    ...SHADOWS.modal,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
