import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../../constants/theme';

export const ScheduleRow = ({
  schedule,
  onEdit,
  onDelete,
  onToggleAvailability,
  onViewWaitingList,
}) => {
  const bookedCount = schedule.bookedTokensCount || 0;
  const availableCount =
    schedule.availableTokensCount !== undefined
      ? schedule.availableTokensCount
      : Math.max(0, (schedule.totalTokens || 20) - bookedCount);
  const isFull = schedule.isAvailable && bookedCount >= (schedule.totalTokens || 20);

  return (
    <View style={[styles.container, !schedule.isAvailable && styles.containerDisabled]}>
      {/* Date, Time & Status */}
      <View style={styles.topRow}>
        <View style={styles.dateBlock}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textPrimary} />
          <Text style={styles.dateText}>{schedule.date}</Text>
          <Text style={styles.timeText}>
            • {schedule.startTime} - {schedule.endTime}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            !schedule.isAvailable
              ? styles.statusPillUnavailable
              : isFull
              ? styles.statusPillFull
              : styles.statusPillAvailable,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              !schedule.isAvailable
                ? styles.statusPillTextUnavailable
                : isFull
                ? styles.statusPillTextFull
                : styles.statusPillTextAvailable,
            ]}
          >
            {!schedule.isAvailable ? 'Unavailable' : isFull ? 'Full' : 'Available'}
          </Text>
        </View>
      </View>

      {/* Sessions Breakdown */}
      {schedule.sessions && schedule.sessions.length > 0 && (
        <View style={styles.sessionsWrapper}>
          <Text style={styles.sessionsHeading}>Sessions ({schedule.sessions.length}):</Text>
          <View style={styles.sessionPillsContainer}>
            {schedule.sessions.map((s, sIdx) => {
              const isExpired = s.isExpired !== undefined ? s.isExpired : false;
              const statusBadgeText = isExpired ? 'EXPIRED' : (s.timeStatus || 'ACTIVE');
              const statusBadgeBg = isExpired ? '#FEE2E2' : statusBadgeText === 'ACTIVE' ? '#DCFCE7' : '#EFF6FF';
              const statusBadgeColor = isExpired ? '#DC2626' : statusBadgeText === 'ACTIVE' ? '#16A34A' : '#2563EB';

              return (
                <View key={s._id || sIdx} style={styles.adminSessionChip}>
                  <View style={styles.sessionDetailsWrap}>
                    <Text style={styles.adminSessionName}>{s.name || `Session ${sIdx + 1}`}:</Text>
                    <Text style={styles.adminSessionTime}>{s.startTime} - {s.endTime}</Text>
                    <Text style={styles.adminSessionCapacity}>• {s.totalTokens} tokens</Text>
                    {s.bookedTokensCount !== undefined && (
                      <Text style={styles.adminSessionBooked}> (Booked: {s.bookedTokensCount})</Text>
                    )}
                  </View>
                  <View style={[styles.timeStatusPill, { backgroundColor: statusBadgeBg }]}>
                    <Text style={[styles.timeStatusText, { color: statusBadgeColor }]}>
                      {statusBadgeText}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Token Stats and Fee */}
      <View style={styles.tokenStatsRow}>
        <View style={styles.tokenStatPill}>
          <Text style={styles.tokenStatLabel}>Total: </Text>
          <Text style={styles.tokenStatVal}>{schedule.totalTokens}</Text>
        </View>
        <View style={styles.tokenStatPill}>
          <Text style={styles.tokenStatLabel}>Booked: </Text>
          <Text style={[styles.tokenStatVal, { color: COLORS.primary }]}>
            {bookedCount}
          </Text>
        </View>
        <View style={styles.tokenStatPill}>
          <Text style={styles.tokenStatLabel}>Available: </Text>
          <Text style={[styles.tokenStatVal, { color: '#059669' }]}>
            {availableCount}
          </Text>
        </View>
        <View style={styles.tokenStatPill}>
          <Text style={styles.tokenStatLabel}>Fee: </Text>
          <Text style={[styles.tokenStatVal, { color: COLORS.textPrimary }]}>
            ₹{schedule.consultationFee}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.waitingBtn}
          onPress={() => onViewWaitingList(schedule)}
        >
          <Ionicons name="people-outline" size={12} color="#D97706" />
          <Text style={styles.waitingText}>Waiting List</Text>
        </TouchableOpacity>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(schedule)}
          >
            <Ionicons name="pencil-outline" size={12} color="#2563EB" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              !schedule.isAvailable && styles.toggleInactive,
            ]}
            onPress={() => onToggleAvailability(schedule)}
          >
            <Text
              style={[
                styles.toggleText,
                !schedule.isAvailable && styles.toggleTextInactive,
              ]}
            >
              {schedule.isAvailable ? 'Unavailable' : 'Available'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.delBtn}
            onPress={() => onDelete(schedule)}
          >
            <Ionicons name="trash-outline" size={12} color="#DC2626" />
            <Text style={styles.delBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusPillAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusPillFull: {
    backgroundColor: '#FFFBEB',
  },
  statusPillUnavailable: {
    backgroundColor: '#FEF2F2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPillTextAvailable: {
    color: '#059669',
  },
  statusPillTextFull: {
    color: '#D97706',
  },
  statusPillTextUnavailable: {
    color: '#DC2626',
  },
  sessionsWrapper: {
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  sessionsHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sessionPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  adminSessionChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    flex: 1,
    minWidth: '100%',
    gap: 4,
  },
  sessionDetailsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  adminSessionName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 3,
  },
  adminSessionTime: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  adminSessionCapacity: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 3,
  },
  adminSessionBooked: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  timeStatusPill: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  timeStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  tokenStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tokenStatPill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  tokenStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tokenStatVal: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  waitingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  waitingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  toggleBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toggleInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  toggleTextInactive: {
    color: '#DC2626',
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  delBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
