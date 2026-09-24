import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    updateAppointmentStatus,
  } = useAdminAppointments(10);

  const { showSuccess, showError, showConfirm } = useAppAlert();
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedDoctors, setExpandedDoctors] = useState({});

  const toggleDoctorExpand = (doctorId) => {
    setExpandedDoctors((prev) => ({
      ...prev,
      [doctorId]: !prev[doctorId],
    }));
  };

  const groupedAppointments = useMemo(() => {
    const groups = {};
    appointments.forEach((app) => {
      const docId = app.doctor?._id || app.doctor;
      if (!groups[docId]) {
        groups[docId] = {
          doctor: app.doctor,
          appointments: [],
        };
      }
      groups[docId].appointments.push(app);
    });
    return Object.values(groups);
  }, [appointments]);

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

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      showSuccess(`Appointment marked as ${status.replace('_', ' ')}.`, 'Status Updated');
      setModalVisible(false);
    } catch (e) {
      showError(e, 'Update Error');
    }
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
          {['ALL', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.pill, statusFilter === st && styles.pillActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.pillText, statusFilter === st && styles.pillTextActive]}>
                {st.toUpperCase().replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : groupedAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments found matching filters.</Text>
        ) : (
          groupedAppointments.map((group) => {
            const docId = group.doctor?._id || group.doctor;
            const isExpanded = expandedDoctors[docId];

            return (
              <View key={docId} style={styles.doctorGroup}>
                <TouchableOpacity
                  style={styles.doctorHeader}
                  onPress={() => toggleDoctorExpand(docId)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>
                      {group.doctor?.name ? `Dr. ${group.doctor.name}` : 'Unknown Doctor'}
                    </Text>
                    <Text style={styles.doctorSpec}>{group.doctor?.specialization || 'General'}</Text>
                    <Text style={styles.bookingCount}>{group.appointments.length} Booking(s)</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.doctorAppointments}>
                    {group.appointments.map((a) => (
                      <AdminAppointmentCard
                        key={a._id}
                        appointment={a}
                        onPress={handleOpenDetails}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <AdminAppointmentDetails
          appointment={selectedApp}
          onCancelBooking={handleCancelBooking}
          onUpdateStatus={handleUpdateStatus}
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
  doctorGroup: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  doctorName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  doctorSpec: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  bookingCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  doctorAppointments: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: '#F8FAFC',
  },
});
