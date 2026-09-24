import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleRow } from './ScheduleRow';
import { COLORS, RADIUS } from '../../../constants/theme';

export const FacilityScheduleGroup = ({
  facilityGroup,
  onEdit,
  onDelete,
  onToggleAvailability,
  onViewWaitingList,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { facility, schedules = [] } = facilityGroup;

  const count = schedules.length;
  const facilityTypeFormatted = facility?.facilityType
    ? facility.facilityType.replace('_', ' ').toUpperCase()
    : 'FACILITY';

  return (
    <View style={styles.facilityCard}>
      {/* Facility Header Banner */}
      <TouchableOpacity
        style={styles.facilityHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameTypeRow}>
              <Text style={styles.facilityName}>{facility?.name || 'Healthcare Facility'}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{facilityTypeFormatted}</Text>
              </View>
            </View>
            <Text style={styles.addressText}>
              {facility?.city ? `${facility.city}` : ''}
              {facility?.address ? ` • ${facility.address}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {count} {count === 1 ? 'Schedule' : 'Schedules'}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Facility Schedules */}
      {expanded && (
        <View style={styles.schedulesContainer}>
          {schedules.map((schedule) => (
            <ScheduleRow
              key={schedule._id}
              schedule={schedule}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleAvailability={onToggleAvailability}
              onViewWaitingList={onViewWaitingList}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  facilityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexShrink: 1,
  },
  nameTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  typeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  addressText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  schedulesContainer: {
    padding: 10,
  },
});
