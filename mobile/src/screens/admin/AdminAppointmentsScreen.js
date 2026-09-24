import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAdminAppointments } from '../../hooks/admin/useAdminAppointments';
import { AdminAppointmentCard } from '../../components/admin/appointments/AdminAppointmentCard';
import { AdminAppointmentDetails } from '../../components/admin/appointments/AdminAppointmentDetails';
import { AdminFormModal } from '../../components/admin/common/AdminFormModal';
import { AdminPagination } from '../../components/common/AdminPagination';
import { useAppAlert } from '../../components/common/AppAlert';

export const AdminAppointmentsScreen = ({ navigation }) => {
  const {
    appointments,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    pagination,
    loading,
    cancelAppointment,
  } = useAdminAppointments(10);

  const { showSuccess, showError, showConfirm } = useAppAlert();
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setModalVisible(true);
  };

  const handleCancelBooking = (id) => {
    showConfirm({
      title: 'Cancel Booking?',
      message: 'Cancelling this booking will free the token and promote the first waiting list patient. Continue?',
      confirmText: 'Confirm Cancel',
      cancelText: 'Keep Booking',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await cancelAppointment(id);
          showSuccess('Appointment cancelled and waiting list promoted.', 'Booking Cancelled');
          setModalVisible(false);
        } catch (e) {
          showError(e, 'Cancellation Error');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Bookings" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          Appointments & Tokens ({pagination.totalItems || appointments.length})
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search by patient name, phone, or doctor..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {['ALL', 'confirmed', 'completed', 'cancelled'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.pill, statusFilter === st && styles.pillActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.pillText, statusFilter === st && styles.pillTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : appointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments found matching filters.</Text>
        ) : (
          appointments.map((a) => (
            <AdminAppointmentCard
              key={a._id}
              appointment={a}
              onPress={handleOpenDetails}
            />
          ))
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <AdminAppointmentDetails
          appointment={selectedApp}
          onCancelBooking={handleCancelBooking}
          onClose={() => setModalVisible(false)}
        />
      </AdminFormModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  search: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 10,
  },
  pillScroll: { marginBottom: 12 },
  pill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
  },
  pillActive: { backgroundColor: COLORS.primarySubtle, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primary, fontWeight: '800' },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 24,
  },
});
