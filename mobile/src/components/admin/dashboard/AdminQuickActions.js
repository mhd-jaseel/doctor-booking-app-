import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const AdminQuickActions = ({ onNavigate }) => {
  const actions = [
    { id: 'facilities', label: 'Manage Healthcare Facilities', icon: 'business-outline' },
    { id: 'doctors', label: 'Manage Doctors & Specialities', icon: 'person-add-outline' },
    { id: 'services', label: 'Manage Healthcare Services', icon: 'grid-outline' },
    { id: 'schedules', label: 'Manage Schedules & Daily Tokens', icon: 'calendar-outline' },
    { id: 'appointments', label: 'Manage Bookings & Waiting Lists', icon: 'clipboard-outline' },
    { id: 'users', label: 'Manage Registered User Accounts', icon: 'people-outline' },
    { id: 'ratings', label: 'View Ratings & Feedback Metrics', icon: 'star-outline' },
  ];

  return (
    <View style={styles.menu}>
      {actions.map((act) => (
        <TouchableOpacity
          key={act.id}
          style={styles.menuItem}
          onPress={() => onNavigate(act.id)}
          activeOpacity={0.7}
        >
          <Ionicons name={act.icon} size={20} color={COLORS.primary} />
          <Text style={styles.label}>{act.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
});
