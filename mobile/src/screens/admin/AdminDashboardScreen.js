import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS } from '../../constants/theme';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import { AdminStatsGrid } from '../../components/admin/dashboard/AdminStatsGrid';
import { AdminQuickActions } from '../../components/admin/dashboard/AdminQuickActions';
import { RecentAppointments } from '../../components/admin/dashboard/RecentAppointments';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';

export const AdminDashboardScreen = ({ navigation }) => {
  const { stats, loading } = useAdminDashboard();
  const { logout } = useAuth();
  const { showConfirm } = useAppAlert();

  const handleAdminLogout = () => {
    showConfirm({
      title: 'Admin Sign Out',
      message: 'Are you sure you want to exit the admin portal?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await logout();
        // AuthContext clears user/token → isAdmin becomes false
        // → RootNavigator auto-switches to User/Public Stack
        // No manual navigation needed.
      },
    });
  };

  const handleNavigate = (section) => {
    switch (section) {
      case 'facilities':
        navigation.navigate('AdminFacilities');
        break;
      case 'doctors':
        navigation.navigate('AdminDoctors');
        break;
      case 'services':
        navigation.navigate('AdminHealthcareServices');
        break;
      case 'schedules':
        navigation.navigate('AdminSchedules');
        break;
      case 'appointments':
        navigation.navigate('AdminAppointments');
        break;
      case 'users':
        navigation.navigate('AdminUsers');
        break;
      case 'ratings':
        navigation.navigate('AdminRatings');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Admin Control Center"
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={handleAdminLogout} style={{ padding: 4 }}>
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13 }}>Sign Out</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <Text style={styles.heading}>System Analytics</Text>
            <AdminStatsGrid stats={stats} />

            <Text style={styles.heading}>Management Areas</Text>
            <AdminQuickActions onNavigate={handleNavigate} />

            <Text style={[styles.heading, { marginTop: 18 }]}>Recent Bookings</Text>
            <RecentAppointments appointments={stats.recentAppointments || []} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12, marginTop: 4 },
});
