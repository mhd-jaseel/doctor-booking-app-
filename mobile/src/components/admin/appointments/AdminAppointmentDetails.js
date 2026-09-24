import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../../constants/theme';

export const AdminAppointmentDetails = ({ appointment, onCancelBooking, onUpdateStatus, onClose }) => {
  if (!appointment) return null;

  return (
    <View>
      <Text style={styles.title}>Appointment Details</Text>
      <ScrollView style={{ maxHeight: 380, marginVertical: 12 }}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PATIENT INFORMATION (Snapshot)</Text>
          <Text style={styles.row}>Name: {appointment.patient?.name}</Text>
          <Text style={styles.row}>Age: {appointment.patient?.age} • Gender: {appointment.patient?.gender}</Text>
          <Text style={styles.row}>Phone: {appointment.patient?.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DOCTOR & FACILITY</Text>
          <Text style={styles.row}>Doctor: Dr. {appointment.doctor?.name} ({appointment.doctor?.specialization})</Text>
          <Text style={styles.row}>Facility: {appointment.hospital?.name} ({appointment.hospital?.facilityType})</Text>
          <Text style={styles.row}>City: {appointment.hospital?.city}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BOOKING & TOKEN</Text>
          <Text style={styles.row}>Date: {appointment.date}</Text>
          <Text style={styles.row}>Assigned Token: #{appointment.tokenNumber}</Text>
          <Text style={styles.row}>Consultation Fee: ₹{appointment.consultationFee} (Snapshot)</Text>
          <Text style={styles.row}>Status: {appointment.status?.toUpperCase().replace('_', ' ')}</Text>
        </View>
      </ScrollView>

      <View style={styles.btns}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        
        {appointment.status === 'confirmed' && (
          <TouchableOpacity style={styles.callBtn} onPress={() => onUpdateStatus(appointment._id, 'in_progress')}>
            <Text style={styles.callText}>Call Token</Text>
          </TouchableOpacity>
        )}
        
        {appointment.status === 'in_progress' && (
          <TouchableOpacity style={styles.completeBtn} onPress={() => onUpdateStatus(appointment._id, 'completed')}>
            <Text style={styles.completeText}>Mark Completed</Text>
          </TouchableOpacity>
        )}

        {appointment.status === 'confirmed' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelBooking(appointment._id)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  section: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 6, letterSpacing: 0.5 },
  row: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 3 },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  closeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#CBD5E1' },
  closeText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  cancelBtn: { backgroundColor: '#DC2626', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  cancelText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  callBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  callText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  completeBtn: { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
  completeText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
});
