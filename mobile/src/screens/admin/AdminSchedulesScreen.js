import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAdminSchedules } from '../../hooks/admin/useAdminSchedules';
import { useAdminDoctors } from '../../hooks/admin/useAdminDoctors';
import { useAdminFacilities } from '../../hooks/admin/useAdminFacilities';
import { DoctorScheduleCard } from '../../components/admin/schedules/DoctorScheduleCard';
import { ScheduleForm } from '../../components/admin/schedules/ScheduleForm';
import { AdminFormModal } from '../../components/admin/common/AdminFormModal';
import { AdminPagination } from '../../components/common/AdminPagination';
import { validateScheduleForm } from '../../utils/admin/adminValidation';
import { groupSchedulesByDoctor } from '../../utils/admin/groupSchedulesByDoctor';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';
import { getErrorMessage } from '../../utils/errorHandler';

import { getTomorrowDate } from '../../utils/dateTimeHelper';

export const AdminSchedulesScreen = ({ navigation }) => {
  const {
    schedules,
    page,
    setPage,
    pagination,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
    fetchWaitingList,
  } = useAdminSchedules(10);
  const { doctors } = useAdminDoctors(100);
  const { facilities } = useAdminFacilities(100);
  const { showSuccess, showError, showConfirm } = useAppAlert();
  const { submit, submitting } = useSubmit('Schedule Saved', 'Operation Failed');

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [waitingListModalVisible, setWaitingListModalVisible] = useState(false);
  const [waitingList, setWaitingList] = useState([]);
  const [selectedSched, setSelectedSched] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Filters state
  const [searchDoctor, setSearchDoctor] = useState('');
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'UNAVAILABLE' | 'FULL'

  const [form, setForm] = useState({
    doctor: '',
    location: '',
    date: getTomorrowDate(),
    sessions: [
      {
        name: 'Morning',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        totalTokens: '10',
        consultationFee: '350',
      },
    ],
  });

  const handleOpenCreate = () => {
    if (submitting) return;
    setIsEditing(false);
    setEditingScheduleId(null);

    const firstDoc = doctors[0];
    const docAssignedHospIds = (firstDoc?.hospitals || []).map((h) =>
      typeof h === 'object' ? h._id : h
    );
    const validFacility = facilities.find((f) => docAssignedHospIds.includes(f._id))?._id || '';

    setForm({
      doctor: firstDoc?._id || '',
      location: validFacility,
      date: getTomorrowDate(),
      sessions: [
        {
          name: 'Morning',
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          totalTokens: '10',
          consultationFee: '350',
        },
      ],
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleOpenEdit = (sched) => {
    if (submitting) return;
    setIsEditing(true);
    setEditingScheduleId(sched._id);

    const existingSessions = (sched.sessions && sched.sessions.length > 0)
      ? sched.sessions.map((s) => ({
          _id: s._id,
          name: s.name || '',
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          totalTokens: String(s.totalTokens || 10),
          consultationFee: String(s.consultationFee || 350),
          isAvailable: s.isAvailable !== false,
        }))
      : [
          {
            name: 'Morning',
            startTime: sched.startTime || '10:00 AM',
            endTime: sched.endTime || '01:00 PM',
            totalTokens: `${sched.totalTokens || 10}`,
            consultationFee: `${sched.consultationFee || 350}`,
          },
        ];

    setForm({
      doctor: sched.doctor?._id || sched.doctor,
      location: sched.location?._id || sched.location,
      date: sched.date,
      sessions: existingSessions,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    const errors = validateScheduleForm(form);
    if (errors) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const formattedSessions = (form.sessions || []).map((s) => ({
      ...s,
      totalTokens: Number(s.totalTokens) || 10,
      consultationFee: Number(s.consultationFee) || 350,
    }));

    const payload = {
      doctor: form.doctor,
      location: form.location,
      date: form.date,
      sessions: formattedSessions,
    };

    await submit({
      action: () =>
        isEditing
          ? updateSchedule(editingScheduleId, payload)
          : createSchedule(payload),
      successMessage: isEditing
        ? 'Doctor consultation schedule updated successfully.'
        : 'Doctor consultation schedule created successfully.',
      successTitle: isEditing ? 'Schedule Updated' : 'Schedule Created',
      errorMessage: isEditing
        ? 'Unable to update schedule. Please check details and try again.'
        : 'Unable to create schedule. Please check details and try again.',
      onSuccess: () => {
        setModalVisible(false);
      },
      onError: (err) => {
        const errorData = err.response?.data;
        if (errorData && errorData.code === 'DOCTOR_SCHEDULE_CONFLICT') {
          showWarning(errorData.message, 'Schedule Conflict');
        } else {
          // Fallback to default error handler
          showError(getErrorMessage(err), 'Operation Failed');
        }
      },
    });
  };

  const handleDelete = (sched) => {
    showConfirm({
      title: 'Delete Schedule?',
      message: `Are you sure you want to delete the schedule for ${sched.doctor?.name} on ${sched.date}?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteSchedule(sched._id);
          showSuccess('Schedule deleted successfully.', 'Deleted');
        } catch (e) {
          showError(e, 'Delete Error');
        }
      },
    });
  };

  const handleToggle = (sched) => {
    const actionText = sched.isAvailable ? 'Mark Doctor Unavailable?' : 'Mark Schedule Available?';
    const msg = sched.isAvailable
      ? 'This will cancel confirmed appointments for this session and automatically notify affected patients. Continue?'
      : 'Make this schedule session available again for booking?';

    showConfirm({
      title: actionText,
      message: msg,
      confirmText: sched.isAvailable ? 'Mark Unavailable' : 'Mark Available',
      isDestructive: sched.isAvailable,
      onConfirm: async () => {
        try {
          await toggleStatus(sched._id);
          showSuccess(
            sched.isAvailable
              ? 'Doctor schedule marked as unavailable.'
              : 'Doctor schedule marked as available.',
            'Status Updated'
          );
        } catch (e) {
          showError(e, 'Update Error');
        }
      },
    });
  };

  const handleViewWaiting = async (sched) => {
    setSelectedSched(sched);
    try {
      const list = await fetchWaitingList(sched._id);
      setWaitingList(list);
      setWaitingListModalVisible(true);
    } catch (e) {
      showError(e, 'Waiting List Error');
    }
  };

  // Filter & Group schedules by Doctor._id -> Facility._id -> Schedules
  const groupedDoctors = React.useMemo(() => {
    return groupSchedulesByDoctor(schedules, {
      search: searchDoctor,
      facilityFilter: selectedFacilityFilter,
      statusFilter,
    });
  }, [schedules, searchDoctor, selectedFacilityFilter, statusFilter]);

  const totalFilteredSchedulesCount = React.useMemo(() => {
    return groupedDoctors.reduce((acc, docGrp) => acc + docGrp.totalSchedules, 0);
  }, [groupedDoctors]);

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Schedules" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            Doctor Schedules ({groupedDoctors.length} {groupedDoctors.length === 1 ? 'Doctor Card' : 'Doctor Cards'} • {totalFilteredSchedulesCount} {totalFilteredSchedulesCount === 1 ? 'Session' : 'Sessions'})
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addText}>+ Create Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Controls */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctor name or specialization..."
              value={searchDoctor}
              onChangeText={setSearchDoctor}
            />
            {searchDoctor ? (
              <TouchableOpacity onPress={() => setSearchDoctor('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
            {['ALL', 'AVAILABLE', 'FULL', 'UNAVAILABLE'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : groupedDoctors.length === 0 ? (
          <Text style={styles.empty}>No matching consultation schedules found.</Text>
        ) : (
          groupedDoctors.map((docGrp) => (
            <DoctorScheduleCard
              key={docGrp.key}
              doctorGroup={docGrp}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggle}
              onViewWaitingList={handleViewWaiting}
            />
          ))
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => !submitting && setModalVisible(false)}>
        <ScheduleForm
          form={form}
          errors={formErrors}
          doctors={doctors}
          facilities={facilities}
          allSchedules={schedules}
          editingScheduleId={editingScheduleId}
          onChange={(newForm) => {
            setForm(newForm);
            // Clear specific error on change
            const keys = Object.keys(newForm);
            if (Object.keys(formErrors).length > 0) {
              const updatedErrors = { ...formErrors };
              let changed = false;
              keys.forEach((k) => {
                if (newForm[k] !== form[k] && updatedErrors[k]) {
                  delete updatedErrors[k];
                  changed = true;
                }
              });
              if (changed) setFormErrors(updatedErrors);
            }
          }}
          onSave={handleSave}
          onCancel={() => setModalVisible(false)}
          saving={submitting}
          isEditing={isEditing}
        />
      </AdminFormModal>

      <AdminFormModal visible={waitingListModalVisible} onClose={() => setWaitingListModalVisible(false)}>
        <View>
          <Text style={styles.heading}>Waiting List Queue ({waitingList.length})</Text>
          <Text style={styles.sub}>{selectedSched?.doctor?.name} on {selectedSched?.date}</Text>
          <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
            {waitingList.length === 0 ? (
              <Text style={styles.empty}>No patients on waiting list.</Text>
            ) : (
              waitingList.map((item) => (
                <View key={item._id} style={styles.waitRow}>
                  <Text style={styles.pos}>#{item.position}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.patientName}>{item.patient?.name}</Text>
                    <Text style={styles.patientMeta}>Phone: {item.patient?.phone}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setWaitingListModalVisible(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </AdminFormModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  addText: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginLeft: 4 },
  filterSection: { marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: COLORS.textPrimary, marginLeft: 6 },
  filterChipsRow: { flexDirection: 'row', marginBottom: 4 },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.white },
  waitRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  pos: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  patientName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  patientMeta: { fontSize: 11, color: COLORS.textSecondary },
  closeBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: RADIUS.md, alignItems: 'center' },
  closeText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  empty: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginVertical: 16 },
});
