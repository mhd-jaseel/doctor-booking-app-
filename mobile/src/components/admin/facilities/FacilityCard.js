import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppImage } from '../../common/AppImage';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const FacilityCard = ({
  facility,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  actionLoading = false,
}) => {
  const typeFormatted = facility.facilityType ? facility.facilityType.replace('_', ' ').toUpperCase() : 'FACILITY';

  return (
    <View style={styles.card}>
      <AppImage
        source={facility.image}
        fallbackType="facility"
        style={styles.avatar}
        imageStyle={{ borderRadius: RADIUS.md }}
        iconSize={32}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{facility.name}</Text>
          <View style={[styles.badge, !facility.isActive && styles.badgeInactive]}>
            <Text style={styles.badgeText}>{typeFormatted}</Text>
          </View>
          <View style={[styles.statusBadge, facility.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, facility.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {facility.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>
        <Text style={styles.sub}>{facility.address}, {facility.city}</Text>
        <Text style={styles.meta}>Phone: {facility.phone} • Hours: {facility.workingHours}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(facility)} disabled={actionLoading}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        {facility.isActive ? (
          <TouchableOpacity
            style={styles.deactivateBtn}
            onPress={() => onDeactivate(facility)}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={() => onActivate(facility)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.activateBtnText}>Activate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(facility)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={13} color="#DC2626" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeInactive: { backgroundColor: '#FEF2F2' },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusInactive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  sub: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deactivateBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deactivateBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  activateBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activateBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  deleteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
});
