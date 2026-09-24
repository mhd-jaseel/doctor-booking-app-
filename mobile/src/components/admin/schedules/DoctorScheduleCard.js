import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../../common/AppImage';
import { FacilityScheduleGroup } from './FacilityScheduleGroup';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

/**
 * Top-level DoctorScheduleCard:
 * Strict 1-card-per-doctor rule. Grouped by doctor._id.
 * Contains nested facilities, which contain schedules and sessions.
 */
export const DoctorScheduleCard = ({
  doctorGroup,
  onEdit,
  onDelete,
  onToggleAvailability,
  onViewWaitingList,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { doctor, facilities = [], totalFacilities = 0, totalSchedules = 0 } = doctorGroup;

  return (
    <View style={styles.card}>
      {/* Top Doctor Header */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <AppImage
            source={doctor?.image || doctor?.photo}
            fallbackType="doctor"
            gender={doctor?.gender || 'male'}
            style={styles.avatar}
            imageStyle={{ borderRadius: RADIUS.md }}
            iconSize={28}
          />

          <View style={styles.headerInfo}>
            <View style={styles.docNameRow}>
              <Text style={styles.docName}>{doctor?.name || 'Doctor'}</Text>
              {doctor?.specialization ? (
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>{doctor.specialization}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {doctor?.qualification ? `${doctor.qualification} • ` : ''}
                {totalFacilities} {totalFacilities === 1 ? 'Facility' : 'Facilities'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {totalSchedules} {totalSchedules === 1 ? 'Schedule' : 'Schedules'}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Facilities List */}
      {expanded && (
        <View style={styles.body}>
          {facilities.length === 0 ? (
            <Text style={styles.emptyText}>No facilities or schedules assigned.</Text>
          ) : (
            facilities.map((facGroup) => (
              <FacilityScheduleGroup
                key={facGroup.facility?._id || facGroup.facility}
                facilityGroup={facGroup}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleAvailability={onToggleAvailability}
                onViewWaitingList={onViewWaitingList}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  headerInfo: {
    flex: 1,
    flexShrink: 1,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  docName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  specBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  specBadgeText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  body: {
    padding: 12,
    backgroundColor: COLORS.white,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 8,
  },
});
