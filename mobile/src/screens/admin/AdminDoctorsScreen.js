import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAdminDoctors } from '../../hooks/admin/useAdminDoctors';
import { useAdminFacilities } from '../../hooks/admin/useAdminFacilities';
import { DoctorCard } from '../../components/admin/doctors/DoctorCard';
import { DoctorForm } from '../../components/admin/doctors/DoctorForm';
import { DoctorFacilityManager } from '../../components/admin/doctors/DoctorFacilityManager';
import { AdminFormModal } from '../../components/admin/common/AdminFormModal';
import { AdminPagination } from '../../components/common/AdminPagination';
import { validateDoctorForm } from '../../utils/admin/adminValidation';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';

export const AdminDoctorsScreen = ({ navigation }) => {
  const {
    doctors,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    pagination,
    loading,
    saveDoctor,
    toggleStatus,
    deleteDoctor,
    assignFacility,
    removeFacility,
  } = useAdminDoctors(10);

  const { facilities } = useAdminFacilities(100);
  const { showSuccess, showError, showConfirm } = useAppAlert();
  const { submit: submitDoctor, submitting: savingDoctor } = useSubmit('Doctor Saved', 'Save Failed');
  const { submit: submitAssign, submitting: assigningFacility } = useSubmit('Facility Assigned', 'Assignment Error');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedDoctorForAssign, setSelectedDoctorForAssign] = useState(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [form, setForm] = useState({
    name: '',
    gender: 'male',
    image: '',
    imageFileId: null,
    specialization: 'GENERAL MEDICINE',
    qualification: 'MBBS',
    experience: '5',
    consultationFee: '350',
    about: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenModal = (doc = null) => {
    if (savingDoctor) return;
    if (doc) {
      setEditingDoctor(doc);
      setForm({
        name: doc.name,
        gender: doc.gender || 'male',
        image: doc.image || '',
        imageFileId: doc.imageFileId || null,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience?.toString() || '5',
        consultationFee: doc.consultationFee?.toString() || '350',
        about: doc.about || '',
      });
    } else {
      setEditingDoctor(null);
      setForm({
        name: '',
        gender: 'male',
        image: '',
        imageFileId: null,
        specialization: 'GENERAL MEDICINE',
        qualification: 'MBBS',
        experience: '5',
        consultationFee: '350',
        about: '',
      });
    }
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    const errors = validateDoctorForm(form);
    if (errors) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload = {
      ...form,
      specialization: form.specialization.trim().toUpperCase(),
      experience: Number(form.experience) || 0,
      consultationFee: Number(form.consultationFee) || 350,
    };

    await submitDoctor({
      action: () => saveDoctor(payload, editingDoctor?._id),
      successMessage: editingDoctor ? 'Doctor updated successfully.' : 'Doctor created successfully.',
      successTitle: 'Doctor Saved',
      errorMessage: 'Unable to save the doctor. Please try again.',
      onSuccess: () => {
        setModalVisible(false);
      },
    });
  };

  const handleOpenAssign = (doc) => {
    if (assigningFacility) return;
    setSelectedDoctorForAssign(doc);
    if (facilities.length > 0) setSelectedFacilityId(facilities[0]._id);
    setAssignModalVisible(true);
  };

  const handleAssign = async () => {
    if (!selectedFacilityId || !selectedDoctorForAssign) return;
    await submitAssign({
      action: () => assignFacility(selectedDoctorForAssign._id, selectedFacilityId),
      successMessage: 'Doctor assigned to facility successfully.',
      successTitle: 'Facility Assigned',
      errorMessage: 'Unable to assign doctor to facility. Please try again.',
      onSuccess: () => {
        setAssignModalVisible(false);
      },
    });
  };

  const handleDeactivate = (doc) => {
    showConfirm({
      title: 'Deactivate Doctor?',
      message: `"${doc.name}" will no longer be available for new appointments. Existing appointment records will be preserved.`,
      confirmText: 'Deactivate',
      isDestructive: true,
      onConfirm: async () => {
        setActionLoadingId(doc._id);
        try {
          await toggleStatus(doc._id, false);
          showSuccess(`Doctor "${doc.name}" has been deactivated.`);
        } catch (err) {
          showError(err, 'Deactivation Failed');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleActivate = (doc) => {
    showConfirm({
      title: 'Activate Doctor?',
      message: `"${doc.name}" will become available for new appointments again.`,
      confirmText: 'Activate',
      isDestructive: false,
      onConfirm: async () => {
        setActionLoadingId(doc._id);
        try {
          await toggleStatus(doc._id, true);
          showSuccess(`Doctor "${doc.name}" has been activated.`);
        } catch (err) {
          showError(err, 'Activation Failed');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleDelete = (doc) => {
    showConfirm({
      title: 'Delete Doctor?',
      message: `Are you sure you want to permanently delete "${doc.name}"? This action cannot be undone. If historical appointments exist, please deactivate instead.`,
      confirmText: 'Delete Doctor',
      isDestructive: true,
      onConfirm: async () => {
        setActionLoadingId(doc._id);
        try {
          await deleteDoctor(doc._id);
          showSuccess(`Doctor "${doc.name}" deleted successfully.`);
        } catch (err) {
          showError(err, 'Deletion Failed');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleRemoveFacility = (docId, facId) => {
    showConfirm({
      title: 'Remove Facility Assignment?',
      message: 'Are you sure you want to remove this doctor from the selected facility?',
      confirmText: 'Remove',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await removeFacility(docId, facId);
          showSuccess('Doctor removed from facility successfully.');
        } catch (err) {
          showError(err, 'Removal Failed');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Doctors" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            Medical Practitioners ({pagination.totalItems || doctors.length})
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addText}>New Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs (ALL / ACTIVE / INACTIVE) */}
        <View style={styles.filterRow}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => {
            const isActive = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setStatusFilter(st)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search doctors by name or specialization..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : doctors.length === 0 ? (
          <Text style={styles.emptyText}>No doctors found matching filters.</Text>
        ) : (
          doctors.map((doc) => (
            <DoctorCard
              key={doc._id}
              doc={doc}
              onEdit={handleOpenModal}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onAssignFacility={handleOpenAssign}
              onRemoveFacility={(docId, facId) => handleRemoveFacility(docId, facId)}
              actionLoading={actionLoadingId === doc._id}
            />
          ))
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => !savingDoctor && setModalVisible(false)}>
        <DoctorForm
          form={form}
          errors={formErrors}
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
          saving={savingDoctor}
        />
      </AdminFormModal>

      <AdminFormModal visible={assignModalVisible} onClose={() => !assigningFacility && setAssignModalVisible(false)}>
        <DoctorFacilityManager
          doctor={selectedDoctorForAssign}
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={setSelectedFacilityId}
          onAssign={handleAssign}
          onCancel={() => setAssignModalVisible(false)}
          assigning={assigningFacility}
        />
      </AdminFormModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md },
  addText: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginLeft: 4 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  search: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 24,
  },
});
