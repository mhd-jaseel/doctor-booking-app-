import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { formatDate } from '../../utils/dateTimeHelper';

/**
 * AvailableDays:
 * Horizontal date selector and calendar icon date-picker for user booking screen.
 * Supports consultation schedules within the next 2 months.
 * Displays only dates where doctor actually has available schedules; unavailable dates are non-selectable.
 */
export const AvailableDays = ({
  schedules = [],
  selectedIndex = 0,
  onSelectDate,
}) => {
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  if (!schedules || schedules.length === 0) {
    return (
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeading}>Available Days</Text>
        <View style={styles.unavailableBanner}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.notAvailable} />
          <Text style={styles.unavailableText}>No consultation schedules available within the next 2 months.</Text>
        </View>
      </View>
    );
  }

  // Display initial 3 dates horizontally in the primary bar
  const visibleSchedules = schedules.slice(0, 3);

  const getDayLabel = (dateStr) => {
    if (!dateStr) return 'Day';
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = formatDate(tomorrow);
    if (dateStr === tomorrowFormatted) return 'Tomorrow';

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()] || 'Day';
  };

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionHeading}>Available Days</Text>

      {/* Main Compact Date Selector Container */}
      <View style={styles.container}>
        {/* Horizontal Dates Row */}
        <View style={styles.datesRow}>
          {visibleSchedules.map((sched, index) => {
            const isSelected = selectedIndex === index;
            const isAvailable = sched.isAvailable !== false;
            const dayLabel = getDayLabel(sched.date);
            const formattedDate = getFormattedDate(sched.date);

            return (
              <TouchableOpacity
                key={sched._id || sched.date}
                style={[
                  styles.dateTab,
                  !isAvailable && styles.dateTabDisabled,
                ]}
                onPress={() => isAvailable && onSelectDate(index)}
                disabled={!isAvailable}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelActive,
                    !isAvailable && styles.textDisabled,
                  ]}
                >
                  {dayLabel}
                </Text>

                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dateNumActive,
                    !isAvailable && styles.textDisabled,
                  ]}
                >
                  {formattedDate}
                </Text>

                {/* Active Indicator Underline */}
                {isSelected ? (
                  <View style={styles.activeIndicator} />
                ) : (
                  <View style={styles.inactiveSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Calendar Button */}
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => setCalendarModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Calendar Picker Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Available Schedules</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalNotice}>
              Select from available doctor schedules within the next 2 months. Unavailable dates are disabled.
            </Text>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDatesList}>
                {schedules.map((sched, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isAvailable = sched.isAvailable !== false;
                  const dayLabel = getDayLabel(sched.date);
                  const formattedDate = getFormattedDate(sched.date);
                  const locationName = sched.location?.name || 'Assigned Facility';

                  return (
                    <TouchableOpacity
                      key={sched._id || sched.date}
                      style={[
                        styles.modalDateItem,
                        isSelected && styles.modalDateItemActive,
                        !isAvailable && styles.modalDateItemDisabled,
                      ]}
                      onPress={() => {
                        if (isAvailable) {
                          onSelectDate(idx);
                          setCalendarModalVisible(false);
                        }
                      }}
                      disabled={!isAvailable}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.modalDayText,
                            isSelected && styles.modalDayTextActive,
                            !isAvailable && styles.textDisabled,
                          ]}
                        >
                          {dayLabel} • {formattedDate}
                        </Text>
                        <Text
                          style={[
                            styles.modalLocationText,
                            isSelected && styles.modalLocationTextActive,
                            !isAvailable && styles.textDisabled,
                          ]}
                        >
                          {locationName}
                        </Text>
                        <Text
                          style={[
                            styles.modalHoursText,
                            isSelected && styles.modalHoursTextActive,
                            !isAvailable && styles.textDisabled,
                          ]}
                        >
                          {sched.startTime || '10:00 AM'} - {sched.endTime || '08:00 PM'}
                        </Text>
                      </View>

                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                      ) : !isAvailable ? (
                        <Text style={styles.unavailableTag}>Unavailable</Text>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    marginVertical: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 6,
    ...SHADOWS.subtle,
  },
  datesRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dateTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 78,
  },
  dateTabDisabled: {
    opacity: 0.45,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dayLabelActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  dateNum: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateNumActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 4,
  },
  inactiveSpacer: {
    height: 3,
    marginTop: 4,
  },
  calendarBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    ...SHADOWS.subtle,
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unavailableText: {
    fontSize: 13,
    color: COLORS.notAvailable,
    fontWeight: '600',
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalNotice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalScrollView: {
    maxHeight: 340,
  },
  modalDatesList: {
    gap: 8,
  },
  modalDateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFCFF',
  },
  modalDateItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  modalDateItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#F8FAFC',
  },
  modalDayText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalDayTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  modalLocationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  modalLocationTextActive: {
    color: COLORS.primaryDark,
  },
  modalHoursText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  modalHoursTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  unavailableTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.notAvailable,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
});
