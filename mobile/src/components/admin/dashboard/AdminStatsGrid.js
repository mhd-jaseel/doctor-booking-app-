import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/theme';
import { AdminStatCard } from './AdminStatCard';

export const AdminStatsGrid = ({ stats }) => {
  return (
    <View style={styles.grid}>
      <AdminStatCard
        icon="people"
        color={COLORS.primary}
        value={stats.totalUsers}
        label="Registered Users"
      />
      <AdminStatCard
        icon="medkit"
        color="#059669"
        value={stats.totalDoctors}
        label="Active Doctors"
      />
      <AdminStatCard
        icon="business"
        color="#0284C7"
        value={stats.totalFacilities}
        label="Facilities"
      />
      <AdminStatCard
        icon="calendar"
        color="#7C3AED"
        value={stats.todayAppointments}
        label="Today's Bookings"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
