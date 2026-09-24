import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppButton } from '../../components/common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { appointmentService } from '../../services';
import { useAppAlert } from '../../components/common/AppAlert';
import { useSubmit } from '../../hooks/useSubmit';

export const AppointmentConfirmScreen = ({ navigation, route }) => {
  const { doctor, schedule, session, tokenNumber, patient } = route.params || {};
  const { showError, showWarning, showSuccess } = useAppAlert();
  const { submit, submitting } = useSubmit();

  const handleConfirmAppointment = async () => {
    const payload = {
      scheduleId: schedule._id,
      sessionId: session?._id,
      tokenNumber,
      date: schedule.date,
      patient,
    };

    await submit({
      action: async () => {
        const res = await appointmentService.bookAppointment(payload);
        return res.data?.appointment;
      },
      silentSuccess: true,
      onSuccess: (appointment) => {
        showSuccess(
          'Your appointment has been confirmed successfully.',
          'Appointment Booked',
          () => navigation.navigate('Home')
        );
      },
      onError: (error) => {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ||
          error.message ||
          'Unable to complete booking. Please try again.';

        if (status === 409) {
          if (message.includes('ended') || message.includes('no longer available') || message.includes('session has ended')) {
            showWarning(
              'This consultation session has ended. Token booking is no longer available.',
              'Session Ended',
              () => navigation.navigate('BookSlot', { doctorId: doctor._id })
            );
          } else if (message.includes('already exists') || message.includes('same patient') || message.includes('duplicate')) {
            showWarning(
              'An appointment already exists for this patient with this doctor on this date.',
              'Appointment Already Exists'
            );
          } else {
            showWarning(
              'This token is no longer available. Please select another slot.',
              'Slot Unavailable',
              () => navigation.navigate('BookSlot', { doctorId: doctor._id })
            );
          }
        } else if (status === 400 && message.includes('maximum of 3')) {
          showWarning(
            'You can book a maximum of 3 tokens for this doctor on this date.',
            'Booking Limit'
          );
        } else {
          showError(error, 'Booking Notice');
        }
      },
    });
  };

  const sessionFee = session?.consultationFee !== undefined
    ? session.consultationFee
    : (schedule?.consultationFee !== undefined ? schedule.consultationFee : (doctor?.consultationFee || 0));

  const sessionHours = session?.startTime && session?.endTime
    ? `${session.startTime} - ${session.endTime}`
    : (schedule?.startTime && schedule?.endTime ? `${schedule.startTime} - ${schedule.endTime}` : 'OPD Hours');

  return (
    <UserLayout>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Big Token Display Card */}
        <View style={styles.tokenHighlightCard}>
          <Text style={styles.highlightSub}>YOUR ALLOCATED TOKEN</Text>
          <Text style={styles.highlightNum}>#{tokenNumber}</Text>
          <Text style={styles.highlightDate}>{schedule?.date}{session?.name ? ` • ${session.name}` : ''}</Text>
        </View>

        {/* Doctor & Location Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Doctor & Consultation Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.val}>{doctor?.name}</Text>
              <Text style={styles.subVal}>{doctor?.specialization} ({doctor?.qualification})</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="business" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Location / Facility</Text>
              <Text style={styles.val}>
                {schedule?.location?.name || 'Healthcare Facility'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Consultation Hours ({session?.name || 'Session'})</Text>
              <Text style={styles.val}>{sessionHours}</Text>
              <Text style={styles.subVal}>Queue order based on token #{tokenNumber}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Consultation Fee</Text>
              <Text style={styles.val}>₹{sessionFee}</Text>
            </View>
          </View>
        </View>

        {/* Patient Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Patient Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Patient Name</Text>
              <Text style={styles.val}>{patient?.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Age & Gender</Text>
              <Text style={styles.val}>
                {patient?.age} Years • {patient?.gender?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <View style={styles.detailTextWrap}>
              <Text style={styles.label}>Contact Phone</Text>
              <Text style={styles.val}>{patient?.phone}</Text>
            </View>
          </View>
        </View>

        {/* Confirmation Button with instant double-click lock */}
        <AppButton
          title="Confirm Appointment"
          loadingTitle="Booking Appointment..."
          loading={submitting}
          onPress={handleConfirmAppointment}
          size="lg"
          icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tokenHighlightCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  highlightSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.5,
  },
  highlightNum: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.white,
    marginVertical: 4,
  },
  highlightDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E7FF',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    ...SHADOWS.subtle,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  val: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  subVal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    marginTop: 10,
    gap: 8,
    ...SHADOWS.card,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
});
