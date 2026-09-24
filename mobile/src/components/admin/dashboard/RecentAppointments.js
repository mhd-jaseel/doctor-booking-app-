import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../../constants/theme';

export const RecentAppointments = ({ appointments = [] }) => {
  if (appointments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No recent appointments.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {appointments.slice(0, 5).map((app) => (
        <View key={app._id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patient}>{app.patient?.name || 'Patient'} (Token #{app.tokenNumber})</Text>
            <Text style={styles.sub}>{app.doctor?.name} • {app.hospital?.name}</Text>
          </View>
          <View
            style={[
              styles.badge,
              app.status === 'confirmed' && styles.confirmed,
              app.status === 'completed' && styles.completed,
              app.status === 'cancelled' && styles.cancelled,
            ]}
          >
            <Text style={styles.badgeText}>{app.status?.toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  patient: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  confirmed: { backgroundColor: '#EFF6FF' },
  completed: { backgroundColor: '#ECFDF5' },
  cancelled: { backgroundColor: '#FEF2F2' },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
