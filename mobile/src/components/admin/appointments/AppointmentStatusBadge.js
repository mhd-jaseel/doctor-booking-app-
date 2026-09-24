import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../../constants/theme';

export const AppointmentStatusBadge = ({ status }) => {
  return (
    <View
      style={[
        styles.badge,
        status === 'confirmed' && styles.confirmed,
        status === 'completed' && styles.completed,
        status === 'cancelled' && styles.cancelled,
      ]}
    >
      <Text style={styles.text}>{status?.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  confirmed: { backgroundColor: '#EFF6FF' },
  completed: { backgroundColor: '#ECFDF5' },
  cancelled: { backgroundColor: '#FEF2F2' },
  text: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
});
