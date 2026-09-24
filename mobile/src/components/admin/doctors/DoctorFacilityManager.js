import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppButton } from '../../common/AppButton';
import { COLORS, RADIUS } from '../../../constants/theme';

// Allows Admins to select and assign a facility to a doctor.
export const DoctorFacilityManager = ({
  doctor,
  facilities = [],
  selectedFacilityId,
  onSelectFacility,
  onAssign,
  onCancel,
  assigning = false,
}) => {
  return (
    <View>
      <Text style={styles.title}>Assign Facility to {doctor?.name}</Text>
      <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
        {facilities.map((fac) => (
          <TouchableOpacity
            key={fac._id}
            style={[styles.row, selectedFacilityId === fac._id && styles.rowActive]}
            onPress={() => !assigning && onSelectFacility(fac._id)}
            disabled={assigning}
          >
            <Text style={styles.name}>{fac.name}</Text>
            <Text style={styles.sub}>{fac.facilityType?.replace('_', ' ')} • {fac.city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.btns}>
        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={assigning}
          size="sm"
        />
        <AppButton
          title="Assign Facility"
          loadingTitle="Assigning..."
          loading={assigning}
          onPress={onAssign}
          size="sm"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  row: { padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 6 },
  rowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySubtle },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  sub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
});
