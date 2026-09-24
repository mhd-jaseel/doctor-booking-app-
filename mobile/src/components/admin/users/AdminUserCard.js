import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const AdminUserCard = ({ user, onToggleStatus }) => {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.sub}>Role: {user.role?.toUpperCase()}</Text>
        <Text style={styles.meta}>Joined: {new Date(user.createdAt).toLocaleDateString()}</Text>
      </View>

      {user.role !== 'admin' && (
        <TouchableOpacity
          style={[styles.toggleBtn, !user.isActive && styles.toggleInactive]}
          onPress={() => onToggleStatus(user)}
        >
          <Text style={[styles.toggleText, !user.isActive && styles.toggleTextInactive]}>
            {user.isActive ? 'Active' : 'Deactivated'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  email: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  toggleBtn: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#A7F3D0' },
  toggleInactive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  toggleText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  toggleTextInactive: { color: '#DC2626' },
});
