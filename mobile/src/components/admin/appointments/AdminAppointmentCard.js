import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

export const AdminAppointmentCard = ({ appointment, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(appointment)} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{appointment.patient?.name} • Token #{appointment.tokenNumber}</Text>
        <Text style={styles.sub}>Dr. {appointment.doctor?.name} ({appointment.hospital?.name})</Text>
        <Text style={styles.meta}>Date: {appointment.date} • Phone: {appointment.patient?.phone}</Text>
        <Text style={styles.meta}>Fee Snapshot: ₹{appointment.consultationFee || 350}</Text>
      </View>

      <View style={styles.right}>
        <AppointmentStatusBadge status={appointment.status} />
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
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
  title: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
});
