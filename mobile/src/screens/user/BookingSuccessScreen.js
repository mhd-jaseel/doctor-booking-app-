import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const BookingSuccessScreen = ({ navigation, route }) => {
  const { appointment, doctor, schedule, session, tokenNumber, patient } = route.params || {};

  const displayHours = session?.startTime && session?.endTime
    ? `${session.startTime} - ${session.endTime}`
    : (schedule?.startTime && schedule?.endTime ? `${schedule.startTime} - ${schedule.endTime}` : 'OPD Hours');

  return (
    <UserLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Checkmark Banner */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>

        <Text style={styles.title}>Appointment Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your consultation slot has been reserved successfully in the hospital queue.
        </Text>

        {/* Confirmation Ticket Card */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketDocName}>{doctor?.name ? `Dr. ${doctor.name.replace(/^dr\.?\s*/i, '')}` : 'Doctor'}</Text>
            <Text style={styles.ticketSpec}>{doctor?.specialization || 'Consultation'}</Text>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.tokenRow}>
            <View>
              <Text style={styles.tokenSub}>YOUR TOKEN ({session?.name || 'Session'})</Text>
              <Text style={styles.tokenBig}>#{tokenNumber}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateText}>{schedule?.date}</Text>
              <Text style={styles.hoursText}>{displayHours}</Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Patient:</Text>
            <Text style={styles.patientVal}>
              {patient?.name} ({patient?.age}Y, {patient?.gender?.toUpperCase()})
            </Text>
          </View>

          <View style={styles.hospitalRow}>
            <Text style={styles.patientLabel}>Facility:</Text>
            <Text style={styles.patientVal}>
              {schedule?.location?.name || 'Healthcare Facility'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  checkCircle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '100%',
    marginVertical: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.card,
  },
  ticketHeader: {
    alignItems: 'center',
  },
  ticketDocName: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  ticketSpec: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 14,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  tokenBig: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.primary,
  },
  dateBlock: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hoursText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  hospitalRow: {
    flexDirection: 'row',
  },
  patientLabel: {
    width: 60,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  patientVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  homeBtn: {
    paddingVertical: 10,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
