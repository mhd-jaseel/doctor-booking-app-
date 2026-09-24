import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const ScheduleCard = ({
  group,
  onEdit,
  onDelete,
  onToggleAvailability,
  onViewWaitingList,
}) => {
  const [expanded, setExpanded] = useState(true);

  const { doctor, facility, schedules = [] } = group;
  const count = schedules.length;

  return (
    <View style={styles.card}>
      {/* Group Header: Doctor + Facility */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          {doctor?.photo ? (
            <Image source={{ uri: doctor.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {doctor?.name ? doctor.name.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <View style={styles.docNameRow}>
              <Text style={styles.docName}>{doctor?.name || 'Unknown Doctor'}</Text>
              {doctor?.specialization ? (
                <Text style={styles.specBadge}>{doctor.specialization}</Text>
              ) : null}
            </View>

            <View style={styles.facilityRow}>
              <Ionicons name="business-outline" size={13} color={COLORS.primary} />
              <Text style={styles.facilityName}>
                {facility?.name || 'Unknown Facility'}
                {facility?.facilityType ? ` • ${facility.facilityType.replace('_', ' ')}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
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

      {/* Collapsible Schedules List */}
      {expanded && (
        <View style={styles.scheduleList}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>SCHEDULES & SESSIONS</Text>
          </View>

          {schedules.map((sched, index) => {
            const bookedCount = sched.bookedTokensCount || 0;
            const availableCount =
              sched.availableTokensCount !== undefined
                ? sched.availableTokensCount
                : Math.max(0, sched.totalTokens - bookedCount);
            const isFull = sched.isAvailable && bookedCount >= sched.totalTokens;

            return (
              <View
                key={sched._id}
                style={[
                  styles.scheduleRow,
                  index > 0 && styles.scheduleRowDivider,
                  !sched.isAvailable && styles.scheduleRowDisabled,
                ]}
              >
                {/* Date, Time & Status */}
                <View style={styles.scheduleRowTop}>
                  <View style={styles.dateBlock}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textPrimary} />
                    <Text style={styles.dateText}>{sched.date}</Text>
                    <Text style={styles.timeText}>
                      • {sched.startTime} - {sched.endTime}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      !sched.isAvailable
                        ? styles.statusPillUnavailable
                        : isFull
                        ? styles.statusPillFull
                        : styles.statusPillAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        !sched.isAvailable
                          ? styles.statusPillTextUnavailable
                          : isFull
                          ? styles.statusPillTextFull
                          : styles.statusPillTextAvailable,
                      ]}
                    >
                      {!sched.isAvailable ? 'Unavailable' : isFull ? 'Full' : 'Available'}
                    </Text>
                  </View>
                </View>

                {/* Session Breakdown */}
                {sched.sessions && sched.sessions.length > 0 && (
                  <View style={styles.sessionsWrapper}>
                    <Text style={styles.sessionsHeading}>Sessions ({sched.sessions.length}):</Text>
                    <View style={styles.sessionPillsContainer}>
                      {sched.sessions.map((s, sIdx) => {
                        const isExpired = s.isExpired !== undefined
                          ? s.isExpired
                          : (s.endTime ? false : false);
                        const statusBadgeText = isExpired ? 'EXPIRED' : (s.timeStatus || 'ACTIVE');
                        const statusBadgeBg = isExpired ? '#FEE2E2' : statusBadgeText === 'ACTIVE' ? '#DCFCE7' : '#EFF6FF';
                        const statusBadgeColor = isExpired ? '#DC2626' : statusBadgeText === 'ACTIVE' ? '#16A34A' : '#2563EB';

                        return (
                          <View key={s._id || sIdx} style={styles.adminSessionChip}>
                            <Text style={styles.adminSessionName}>{s.name || `Session ${sIdx + 1}`}:</Text>
                            <Text style={styles.adminSessionTime}>{s.startTime} - {s.endTime}</Text>
                            <Text style={styles.adminSessionCapacity}>• {s.totalTokens} tokens</Text>
                            {s.bookedTokensCount !== undefined && (
                              <Text style={styles.adminSessionBooked}> (Booked: {s.bookedTokensCount})</Text>
                            )}
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
                    <Text style={styles.tokenStatVal}>{sched.totalTokens}</Text>
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
                      ₹{sched.consultationFee}
                    </Text>
                  </View>
                </View>

                {/* Date-Specific Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.waitingBtn}
                    onPress={() => onViewWaitingList(sched)}
                  >
                    <Ionicons name="people-outline" size={12} color="#D97706" />
                    <Text style={styles.waitingText}>Waiting List</Text>
                  </TouchableOpacity>

                  <View style={styles.btnGroup}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEdit(sched)}
                    >
                      <Ionicons name="pencil-outline" size={12} color="#2563EB" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        !sched.isAvailable && styles.toggleInactive,
                      ]}
                      onPress={() => onToggleAvailability(sched)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          !sched.isAvailable && styles.toggleTextInactive,
                        ]}
                      >
                        {sched.isAvailable ? 'Unavailable' : 'Available'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => onDelete(sched)}
                    >
                      <Ionicons name="trash-outline" size={12} color="#DC2626" />
                      <Text style={styles.delBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
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
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    fontWeight: '600',
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  facilityName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  scheduleList: {
    padding: 12,
    backgroundColor: COLORS.white,
  },
  listHeaderRow: {
    marginBottom: 8,
  },
  listSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  scheduleRow: {
    paddingVertical: 10,
  },
  scheduleRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
    paddingTop: 12,
  },
  scheduleRowDisabled: {
    opacity: 0.85,
  },
  scheduleRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
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
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
