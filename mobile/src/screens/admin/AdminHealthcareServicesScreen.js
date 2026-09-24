import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminHeader } from '../../components/common/AdminHeader';
import { AdminFormModal } from '../../components/admin/common/AdminFormModal';
import { HealthcareServiceForm } from '../../components/admin/services/HealthcareServiceForm';
import { adminService } from '../../services';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';

export const AdminHealthcareServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const { showConfirm, showSuccess, showError, showWarning } = useAppAlert();
  const { submit, submitting } = useSubmit('Service Saved', 'Save Failed');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'hospital',
    displayOrder: 1,
    color: '#2F65CB',
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getHealthcareServices();
      const list = res?.data?.services || res?.services || [];
      setServices(list);
    } catch (err) {
      console.log('Admin services fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenModal = (item = null) => {
    if (submitting) return;
    if (item) {
      setEditingService(item);
      setForm({
        _id: item._id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        icon: item.icon || 'hospital',
        displayOrder: item.displayOrder || 1,
        color: item.color || '#2F65CB',
      });
    } else {
      setEditingService(null);
      setForm({
        name: '',
        slug: '',
        description: '',
        icon: 'hospital',
        displayOrder: (services.length || 0) + 1,
        color: '#2F65CB',
      });
    }
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Service name is required.';
    if (!form.slug.trim()) errs.slug = 'Identifier slug is required.';
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
    };

    await submit({
      action: async () => {
        if (editingService?._id) {
          await adminService.updateHealthcareService(editingService._id, payload);
        } else {
          await adminService.createHealthcareService(payload);
        }
        await fetchServices();
      },
      successMessage: editingService
        ? 'Healthcare service updated successfully.'
        : 'Healthcare service created successfully.',
      successTitle: 'Healthcare Service Saved',
      errorMessage: 'Unable to save healthcare service. Please try again.',
      onSuccess: () => {
        setModalVisible(false);
      },
    });
  };

  const handleToggleStatus = (item) => {
    const actionName = item.isActive ? 'deactivate' : 'activate';
    showConfirm({
      title: `${item.isActive ? 'Deactivate' : 'Activate'} Service?`,
      message: `Are you sure you want to ${actionName} "${item.name}" on the Home category list?`,
      confirmText: item.isActive ? 'Deactivate' : 'Activate',
      isDestructive: item.isActive,
      onConfirm: async () => {
        try {
          await adminService.toggleHealthcareServiceStatus(item._id);
          showSuccess(`Service ${item.isActive ? 'deactivated' : 'activated'} successfully.`);
          await fetchServices();
        } catch (err) {
          showError(err, 'Status Update Failed');
        }
      },
    });
  };

  const handleDelete = (item) => {
    showConfirm({
      title: 'Delete Healthcare Service?',
      message: `Are you sure you want to delete "${item.name}"? If any facilities reference this category, deletion will be blocked safely.`,
      confirmText: 'Delete Service',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteHealthcareService(item._id);
          showSuccess('Healthcare service deleted successfully.');
          await fetchServices();
        } catch (err) {
          showError(err, 'Delete Failed');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Healthcare Services" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Service Categories ({services.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.addText}>New Service</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="apps-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No custom services configured yet.</Text>
            <Text style={styles.emptySub}>
              Add categories here — they will automatically appear under
              "Others" on the User Home screen.
            </Text>
          </View>
        ) : (
          services.map((item) => (
            <View key={item._id} style={styles.serviceCard}>
              <View style={[styles.iconCircle, { backgroundColor: item.color || COLORS.primary }]}>
                <Ionicons name="medkit" size={20} color={COLORS.white} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <View style={[styles.orderBadge]}>
                    <Text style={styles.orderText}>Order: {item.displayOrder || 1}</Text>
                  </View>
                </View>
                <Text style={styles.slugText}>slug: {item.slug}</Text>
                {item.description ? (
                  <Text style={styles.descText} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleOpenModal(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, !item.isActive && styles.toggleBtnInactive]}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, !item.isActive && styles.toggleTextInactive]}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AdminFormModal visible={modalVisible} onClose={() => !submitting && setModalVisible(false)}>
        <HealthcareServiceForm
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  serviceCard: {
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
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  orderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  slugText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  descText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toggleBtnInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  toggleTextInactive: {
    color: '#DC2626',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
