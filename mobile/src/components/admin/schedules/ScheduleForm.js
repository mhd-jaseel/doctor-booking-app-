import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../common/AppButton';
import { FormFieldError } from '../../common/FormFieldError';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';
import { getTomorrowDate, getMaxScheduleDate, isDateWithinScheduleWindow } from '../../../utils/dateTimeHelper';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthGridDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    const monthStr = `${monthIndex + 1}`.padStart(2, '0');
    const dayStr = `${d}`.padStart(2, '0');
    days.push({
      day: d,
      dateStr: `${year}-${monthStr}-${dayStr}`,
    });
  }
  return days;
}

export const ScheduleForm = ({
  form,
  errors = {},
  doctors = [],
  facilities = [],
  onChange,
  onSave,
  onCancel,
  saving = false,
  isEditing = false,
  allSchedules = [],
  editingScheduleId = null,
}) => {
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const tomorrowStr = getTomorrowDate();
  const maxDateStr = getMaxScheduleDate();

  const [viewYear, setViewYear] = useState(() => {
    const parts = (form.date || tomorrowStr).split('-').map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (form.date || tomorrowStr).split('-').map(Number);
    return (parts[1] || (new Date().getMonth() + 1)) - 1;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minMonthDate = new Date(today);
  minMonthDate.setDate(minMonthDate.getDate() + 1);

  const maxMonthDate = new Date(today);
  maxMonthDate.setMonth(maxMonthDate.getMonth() + 2);

  const isPrevMonthDisabled =
    viewYear < minMonthDate.getFullYear() ||
    (viewYear === minMonthDate.getFullYear() && viewMonth <= minMonthDate.getMonth());

  const isNextMonthDisabled =
    viewYear > maxMonthDate.getFullYear() ||
    (viewYear === maxMonthDate.getFullYear() && viewMonth >= maxMonthDate.getMonth());

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Find selected doctor to filter only facilities they are assigned to
  const selectedDoctorObj = doctors.find((d) => d._id === form.doctor);
  const assignedFacilityIds = (selectedDoctorObj?.hospitals || []).map((h) =>
    typeof h === 'object' ? h._id : h
  );

  const availableFacilities = facilities.filter((f) =>
    assignedFacilityIds.includes(f._id)
  );

  const sessions = form.sessions || [
    {
      name: 'Morning',
      startTime: form.startTime || '10:00 AM',
      endTime: form.endTime || '01:00 PM',
      totalTokens: form.totalTokens ? String(form.totalTokens) : '10',
      consultationFee: form.consultationFee ? String(form.consultationFee) : '350',
    },
  ];

  const existingSchedulesForDate = allSchedules.filter(s => {
    const docId = typeof s.doctor === 'object' ? s.doctor._id : s.doctor;
    return docId === form.doctor && s.date === form.date && s._id !== editingScheduleId;
  });

  const handleUpdateSession = (index, field, value) => {
    const updated = [...sessions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange({ ...form, sessions: updated });
  };

  const handleAddSession = () => {
    const sessionCount = sessions.length;
    const defaultName = sessionCount === 1 ? 'Afternoon' : sessionCount === 2 ? 'Evening' : `Session ${sessionCount + 1}`;
    const defaultStart = sessionCount === 1 ? '02:00 PM' : sessionCount === 2 ? '06:00 PM' : '09:00 AM';
    const defaultEnd = sessionCount === 1 ? '05:00 PM' : sessionCount === 2 ? '08:00 PM' : '12:00 PM';

    const newSession = {
      name: defaultName,
      startTime: defaultStart,
      endTime: defaultEnd,
      totalTokens: '8',
      consultationFee: sessions[0]?.consultationFee || '350',
    };
    onChange({ ...form, sessions: [...sessions, newSession] });
  };

  const handleRemoveSession = (index) => {
    if (sessions.length <= 1) return;
    const updated = sessions.filter((_, i) => i !== index);
    onChange({ ...form, sessions: updated });
  };

  return (
    <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Select Doctor *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        {doctors.map((d) => {
          const isSelected = form.doctor === d._id;
          return (
            <TouchableOpacity
              key={d._id}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => {
                const docAssignedHospIds = (d.hospitals || []).map((h) =>
                  typeof h === 'object' ? h._id : h
                );
                const firstValidFacility = facilities.find((f) =>
                  docAssignedHospIds.includes(f._id)
                )?._id || '';
                onChange({ ...form, doctor: d._id, location: firstValidFacility });
              }}
              disabled={isEditing}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{d.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <FormFieldError error={errors.doctor} />

      <Text style={styles.label}>Select Assigned Facility *</Text>
      {availableFacilities.length === 0 ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            This doctor is not assigned to any facility. Please assign facilities to this doctor first under Manage Doctors.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {availableFacilities.map((f) => {
              const isSelected = form.location === f._id;
              return (
                <TouchableOpacity
                  key={f._id}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => onChange({ ...form, location: f._id })}
                  disabled={isEditing}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <FormFieldError error={errors.location} />
        </>
      )}

      {/* Date Picker Input Row with Calendar Icon */}
      <Text style={styles.label}>Schedule Date *</Text>
      <TouchableOpacity
        style={[styles.dateInputBox, errors.date && styles.inputError]}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.dateInputText}>
          {form.date ? form.date : 'Select Date (Tomorrow - 2 Months)'}
        </Text>
        <View style={styles.calendarIconWrapper}>
          <Ionicons name="calendar" size={18} color={COLORS.white} />
        </View>
      </TouchableOpacity>
      <FormFieldError error={errors.date} />

      {/* Existing Schedules Preview */}
      {form.doctor && form.date && (
        <View style={styles.existingSchedulesContainer}>
          <Text style={styles.existingSchedulesTitle}>
            Existing Schedules on {form.date}
          </Text>
          {existingSchedulesForDate.length > 0 ? (
            existingSchedulesForDate.map(sched => (
              <View key={sched._id} style={styles.existingScheduleItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.existingScheduleText}>
                  {sched.startTime} - {sched.endTime} ({sched.location?.name || 'Another location'})
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.existingScheduleEmpty}>No existing schedules on this date.</Text>
          )}
        </View>
      )}

      {/* Consultation Sessions Section */}
      <View style={styles.sessionHeaderRow}>
        <Text style={styles.sessionSectionTitle}>Consultation Sessions ({sessions.length})</Text>
        <Text style={styles.sessionSectionSub}>Configure one or multiple independent token queues</Text>
      </View>

      {sessions.map((sess, idx) => (
        <View key={sess._id || idx} style={[styles.sessionCard, errors.sessions && { borderColor: '#EF4444', borderWidth: 1 }]}>
          <View style={styles.sessionCardHeader}>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>Session {idx + 1}</Text>
            </View>
            {sessions.length > 1 && (
              <TouchableOpacity
                style={styles.removeSessionBtn}
                onPress={() => handleRemoveSession(idx)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                <Text style={styles.removeSessionText}>Remove Session</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Session Name</Text>
          <TextInput
            style={styles.input}
            value={sess.name}
            onChangeText={(v) => handleUpdateSession(idx, 'name', v)}
            placeholder="e.g. Morning, Late Morning, Evening Consultation"
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={sess.startTime}
                onChangeText={(v) => handleUpdateSession(idx, 'startTime', v)}
                placeholder="10:00 AM"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={styles.input}
                value={sess.endTime}
                onChangeText={(v) => handleUpdateSession(idx, 'endTime', v)}
                placeholder="01:00 PM"
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Total Tokens *</Text>
              <TextInput
                style={styles.input}
                value={String(sess.totalTokens || '')}
                onChangeText={(v) => handleUpdateSession(idx, 'totalTokens', v)}
                keyboardType="numeric"
                placeholder="10"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Consultation Fee (₹) *</Text>
              <TextInput
                style={styles.input}
                value={String(sess.consultationFee || '')}
                onChangeText={(v) => handleUpdateSession(idx, 'consultationFee', v)}
                keyboardType="numeric"
                placeholder="350"
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addSessionButton}
        onPress={handleAddSession}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.addSessionButtonText}>+ Add Another Consultation Session</Text>
      </TouchableOpacity>
      <FormFieldError error={errors.sessions} />

      <View style={styles.btns}>
        <AppButton title="Cancel" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
        <AppButton
          title={isEditing ? 'Update Schedule' : 'Create Schedule'}
          onPress={onSave}
          loading={saving}
          style={{ flex: 1 }}
        />
      </View>

      {/* Admin Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Select Schedule Date</Text>
              </View>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalNotice}>
              Select any date from tomorrow ({tomorrowStr}) through the next 2 months ({maxDateStr}). Today and past dates are blocked.
            </Text>

            {/* Month Header Navigation */}
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity
                style={[styles.monthNavBtn, isPrevMonthDisabled && styles.monthNavBtnDisabled]}
                onPress={handlePrevMonth}
                disabled={isPrevMonthDisabled}
              >
                <Ionicons name="chevron-back" size={20} color={isPrevMonthDisabled ? '#94A3B8' : COLORS.primary} />
              </TouchableOpacity>

              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <TouchableOpacity
                style={[styles.monthNavBtn, isNextMonthDisabled && styles.monthNavBtnDisabled]}
                onPress={handleNextMonth}
                disabled={isNextMonthDisabled}
              >
                <Ionicons name="chevron-forward" size={20} color={isNextMonthDisabled ? '#94A3B8' : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Days of Week Row */}
            <View style={styles.weekDaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {getMonthGridDays(viewYear, viewMonth).map((item, idx) => {
                if (!item) {
                  return <View key={`empty-${idx}`} style={styles.calendarCellEmpty} />;
                }

                const isSelectable = isDateWithinScheduleWindow(item.dateStr);
                const isSelected = form.date === item.dateStr;

                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                      !isSelectable && styles.calendarCellDisabled,
                    ]}
                    onPress={() => {
                      if (isSelectable) {
                        onChange({ ...form, date: item.dateStr });
                        setDatePickerVisible(false);
                      }
                    }}
                    disabled={!isSelectable}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        isSelected && styles.calendarCellTextSelected,
                        !isSelectable && styles.calendarCellTextDisabled,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  inputError: { borderColor: '#EF4444' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  pillTextActive: { color: COLORS.white },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  warningText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  calendarIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionHeaderRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  sessionSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sessionSectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  existingSchedulesContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  existingSchedulesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  existingScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  existingScheduleText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  existingScheduleEmpty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sessionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionBadge: {
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  removeSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  removeSessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    backgroundColor: '#F0F7FF',
    marginTop: 4,
    marginBottom: 10,
  },
  addSessionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
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
  closeBtn: {
    padding: 4,
  },
  modalNotice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 16,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
  },
  monthNavBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  monthTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: RADIUS.md,
  },
  calendarCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarCellDisabled: {
    opacity: 0.35,
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  calendarCellTextSelected: {
    color: COLORS.white,
    fontWeight: '900',
  },
  calendarCellTextDisabled: {
    color: COLORS.textMuted,
  },
});
