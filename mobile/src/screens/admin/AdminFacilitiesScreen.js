import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAdminFacilities } from '../../hooks/admin/useAdminFacilities';
import { FacilityCard } from '../../components/admin/facilities/FacilityCard';
import { FacilityFilters } from '../../components/admin/facilities/FacilityFilters';
import { FacilityForm } from '../../components/admin/facilities/FacilityForm';
import { AdminFormModal } from '../../components/admin/common/AdminFormModal';
import { AdminPagination } from '../../components/common/AdminPagination';
import { validateFacilityForm } from '../../utils/admin/adminValidation';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';

export const AdminFacilitiesScreen = ({ navigation }) => {
  const {
    facilities,
    page,
    setPage,
    search,
    setSearch,
    selectedType,
    setSelectedType,
    statusFilter,
    setStatusFilter,
    pagination,
    loading,
    saveFacility,
    toggleStatus,
    deleteFacility,
  } = useAdminFacilities(10);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const { showConfirm, showSuccess, showError } = useAppAlert();
  const { submit, submitting } = useSubmit('Facility Saved', 'Save Failed');

  const [form, setForm] = useState({
    name: '',
    image: '',
    imageFileId: null,
    facilityType: 'hospital',
    address: '',
    city: 'Kuttippuram',
    phone: '',
    email: '',
    workingHours: '9:00 AM - 5:00 PM',
    facilitiesStr: 'OPD, Pharmacy',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenModal = (fac = null) => {
    if (submitting) return;
    if (fac) {
      setEditingFacility(fac);
      setForm({
        name: fac.name,
        image: fac.image || '',
        imageFileId: fac.imageFileId || null,
        facilityType: fac.facilityType || 'hospital',
        address: fac.address,
        city: fac.city,
        phone: fac.phone,
        email: fac.email || '',
        workingHours: fac.workingHours || '9:00 AM - 5:00 PM',
        facilitiesStr: (fac.facilities || []).join(', '),
      });
    } else {
      setEditingFacility(null);
      setForm({
        name: '',
        image: '',
        imageFileId: null,
        facilityType: 'hospital',
        address: '',
        city: 'Kuttippuram',
        phone: '',
        email: '',
        workingHours: '9:00 AM - 5:00 PM',
        facilitiesStr: 'OPD, Pharmacy',
      });
    }
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    const errors = validateFacilityForm(form);
    if (errors) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload = {
      ...form,
      facilities: form.facilitiesStr.split(',').map((s) => s.trim()).filter(Boolean),
    };

    await submit({
      action: () => saveFacility(payload, editingFacility?._id),
      successMessage: editingFacility
        ? 'Facility updated successfully.'
        : 'Facility created successfully.',
      successTitle: 'Facility Saved',
      errorMessage: 'Unable to save the facility. Please try again.',
      onSuccess: () => {
        setModalVisible(false);
      },
    });
  };

  const handleDeactivate = (fac) => {
    showConfirm({
      title: 'Deactivate Facility?',
      message: `Are you sure you want to deactivate "${fac.name}"? Users will no longer see it for new bookings, but existing history remains intact.`,
      confirmText: 'Deactivate',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await toggleStatus(fac._id, false);
          showSuccess(`"${fac.name}" has been deactivated.`);
        } catch (err) {
          showError(err, 'Deactivation Failed');
        }
      },
    });
  };

  const handleActivate = (fac) => {
    showConfirm({
      title: 'Activate Facility?',
      message: `Activate "${fac.name}" to make it available for users again?`,
      confirmText: 'Activate',
      onConfirm: async () => {
        try {
          await toggleStatus(fac._id, true);
          showSuccess(`"${fac.name}" has been activated.`);
        } catch (err) {
          showError(err, 'Activation Failed');
        }
      },
    });
  };

  const handleDelete = (fac) => {
    showConfirm({
      title: 'Delete Facility Permanently?',
      message: `Permanently delete "${fac.name}"? This action cannot be undone. Facilities with active doctor schedules or appointments cannot be deleted (deactivate them instead).`,
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteFacility(fac._id);
          showSuccess(`"${fac.name}" has been deleted.`);
        } catch (err) {
          showError(err, 'Delete Failed');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Facilities" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            Healthcare Facilities ({pagination.totalItems || facilities.length})
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addText}>New Facility</Text>
          </TouchableOpacity>
        </View>

        <FacilityFilters
          search={search}
          onSearchChange={setSearch}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : facilities.length === 0 ? (
          <Text style={styles.emptyText}>No facilities found matching filters.</Text>
        ) : (
          facilities.map((fac) => (
            <FacilityCard
              key={fac._id}
              facility={fac}
              onEdit={handleOpenModal}
              onDeactivate={() => handleDeactivate(fac)}
              onActivate={() => handleActivate(fac)}
              onDelete={() => handleDelete(fac)}
            />
          ))
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => !submitting && setModalVisible(false)}>
        <FacilityForm
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
          saving={submitting}
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
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 24,
  },
});
