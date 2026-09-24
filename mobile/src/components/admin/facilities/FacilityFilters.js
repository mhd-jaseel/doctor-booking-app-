import React from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../../constants/theme';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Status' },
  { id: 'ACTIVE', label: 'Active Only' },
  { id: 'INACTIVE', label: 'Inactive' },
];

const FACILITY_TYPES = [
  { id: 'ALL', label: 'All Types' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'clinic', label: 'Clinics' },
  { id: 'medical_college', label: 'Medical Colleges' },
  { id: 'speciality_centre', label: 'Speciality' },
  { id: 'polyclinic', label: 'Polyclinics' },
  { id: 'diagnostic_centre', label: 'Diagnostic' },
];

export const FacilityFilters = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search facilities by name or city..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={onSearchChange}
      />
      {onStatusFilterChange && (
        <View style={styles.statusRow}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.statusPill, statusFilter === s.id && styles.statusPillActive]}
              onPress={() => onStatusFilterChange(s.id)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  statusFilter === s.id && styles.statusPillTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FACILITY_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.pill, selectedType === opt.id && styles.pillActive]}
            onPress={() => onTypeChange(opt.id)}
          >
            <Text style={[styles.pillText, selectedType === opt.id && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  search: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.borderLight || '#ECEFF1',
    marginRight: 6,
  },
  statusPillActive: {
    backgroundColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusPillTextActive: {
    color: COLORS.white,
  },
  pill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
  },
  pillActive: { backgroundColor: COLORS.primarySubtle, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primary, fontWeight: '800' },
});

