import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../common/AppImage';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const DoctorCard = ({
  doc,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  onAssignFacility,
  onRemoveFacility,
  actionLoading = false,
}) => {
  return (
    <View style={styles.card}>
      <AppImage
        source={doc.image}
        fallbackType="doctor"
        gender={doc.gender || 'male'}
        style={styles.avatar}
        imageStyle={{ borderRadius: RADIUS.md }}
        iconSize={32}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{doc.name}</Text>
          <View style={[styles.statusBadge, doc.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, doc.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {doc.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <Text style={styles.sub}>{doc.specialization} ({doc.qualification})</Text>
        <Text style={styles.meta}>Exp: {doc.experience} Yrs • Fee: ₹{doc.consultationFee}</Text>


        <View style={styles.facilitiesWrap}>
          <Text style={styles.assignedLabel}>Assigned Facilities:</Text>
          {(doc.hospitals || []).length === 0 ? (
            <Text style={styles.meta}>None assigned.</Text>
          ) : (
            doc.hospitals.map((h) => (
              <View key={h._id || h} style={styles.tag}>
                <Text style={styles.tagText}>{h.name || 'Facility'}</Text>
                <TouchableOpacity onPress={() => onRemoveFacility(doc._id, h._id || h)} disabled={actionLoading}>
                  <Ionicons name="close-circle" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.assignBtn} onPress={() => onAssignFacility(doc)} disabled={actionLoading}>
          <Text style={styles.assignText}>+ Facility</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(doc)} disabled={actionLoading}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        {doc.isActive ? (
          <TouchableOpacity
            style={styles.deactivateBtn}
            onPress={() => onDeactivate(doc)}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.activateBtn}
              onPress={() => onActivate(doc)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.activateBtnText}>Activate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(doc)}
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
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginLeft: 6,
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
    letterSpacing: 0.3,
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#DC2626',
  },
  sub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  facilitiesWrap: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  assignedLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginBottom: 4, gap: 6 },
  tagText: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary },
  actions: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  assignBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  assignText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  editBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  editText: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
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
