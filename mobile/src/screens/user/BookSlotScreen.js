import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppImage } from '../../components/common/AppImage';
import { TokenGrid } from '../../components/booking/TokenGrid';
import { AvailableDays } from '../../components/booking/AvailableDays';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { doctorService, scheduleService, waitingListService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';
import { appCache } from '../../utils/cache';
import { isSessionExpired, getSessionStatus } from '../../utils/dateTimeHelper';
export const BookSlotScreen = ({ navigation, route }) => {
  const { doctorId } = route.params || {};
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showWarning } = useAppAlert();

  const [doctor, setDoctor] = useState(() => (doctorId ? appCache.get(`doctor:detail:${doctorId}`)?.data || null : null));
  const [schedules, setSchedules] = useState(() => (doctorId ? appCache.get(`schedules:doctor:${doctorId}`)?.data || [] : []));
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [selectedTokenSlot, setSelectedTokenSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningWaitingList, setJoiningWaitingList] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Periodically update currentTime every 15 seconds to ensure live session expiry transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    
    // Immediately clear stale state from previously viewed doctor
    const cachedDoc = appCache.get(`doctor:detail:${doctorId}`)?.data || null;
    const cachedScheds = appCache.get(`schedules:doctor:${doctorId}`)?.data || [];
    setDoctor(cachedDoc);
    setSchedules(cachedScheds);
    setSelectedScheduleIndex(0);
    setSelectedSessionIndex(0);
    setSelectedTokenSlot(null);
    setLoading(!cachedDoc);

    loadData();
  }, [doctorId]);

  // Sync polling removed

  const loadData = async () => {
    try {
      const [docRes, schedRes] = await Promise.allSettled([
        doctorService.getDoctorById(doctorId),
        scheduleService.getDoctorSchedules(doctorId),
      ]);

      if (docRes.status === 'fulfilled' && docRes.value.data?.doctor) {
        setDoctor(docRes.value.data.doctor);
        if (doctorId) {
          appCache.set(`doctor:detail:${doctorId}`, docRes.value.data.doctor);
        }
      }
      if (schedRes.status === 'fulfilled' && schedRes.value.data?.schedules) {
        setSchedules(schedRes.value.data.schedules);
        if (doctorId) {
          appCache.set(`schedules:doctor:${doctorId}`, schedRes.value.data.schedules, 60 * 1000);
        }
      }
    } catch (error) {
      console.error('Error loading doctor schedules:', error);
      if (!doctor && schedules.length === 0) {
        showError('Failed to load booking slots. Please try again.', 'Schedule Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentSchedule = schedules[selectedScheduleIndex];

  // Sessions for current schedule (100% dynamic from Admin data)
  const rawSessions = currentSchedule?.sessions || [];
  
  // Mark and filter active/upcoming vs expired sessions
  const activeSessions = rawSessions.filter((sess) => {
    const endTimeStr = sess.endTime || currentSchedule?.endTime || '08:00 PM';
    return !isSessionExpired(currentSchedule?.date, endTimeStr, currentTime);
  });

  const availableSessions = activeSessions.length > 0 ? activeSessions : rawSessions;
  const activeSessionIndex = Math.min(selectedSessionIndex, Math.max(0, availableSessions.length - 1));
  const activeSession = availableSessions[activeSessionIndex] || null;

  const isCurrentSessionExpired = activeSession
    ? isSessionExpired(currentSchedule?.date, activeSession.endTime || currentSchedule?.endTime || '08:00 PM', currentTime)
    : (currentSchedule ? isSessionExpired(currentSchedule.date, currentSchedule.endTime || '08:00 PM', currentTime) : false);

  // Active slots for selected session (or fallback to schedule.slots)
  const displayedSlots = activeSession?.slots || currentSchedule?.slots || [];
  const availableSlotsList = displayedSlots.filter((s) => !s.isBooked);
  const isDoctorUnavailable = !currentSchedule || !currentSchedule.isAvailable;
  const isSessionUnavailable = activeSession ? activeSession.isAvailable === false : false;
  const isAllBooked = displayedSlots.length > 0 && availableSlotsList.length === 0;

  // Consultation Hours: If single session, show session range; if multiple, show earliest to latest
  const consultationHoursText = currentSchedule
    ? `${currentSchedule.startTime || '10:00 AM'} - ${currentSchedule.endTime || '08:00 PM'}`
    : 'Not available';

  const currentFee = activeSession?.consultationFee !== undefined
    ? activeSession.consultationFee
    : (currentSchedule?.consultationFee !== undefined ? currentSchedule.consultationFee : (doctor?.consultationFee || 350));

  const handleTokenSelect = (slot) => {
    if (isCurrentSessionExpired) {
      showWarning(
        'This consultation session has ended. Token booking is no longer available.',
        'Session Ended'
      );
      return;
    }

    setSelectedTokenSlot(slot);
    const sessionData = activeSession || {
      _id: currentSchedule?._id,
      name: 'Consultation',
      startTime: currentSchedule?.startTime,
      endTime: currentSchedule?.endTime,
      consultationFee: currentFee,
    };

    if (!isAuthenticated) {
      navigation.navigate('Login', {
        pendingBooking: {
          doctor,
          schedule: currentSchedule,
          session: sessionData,
          tokenNumber: slot.tokenNumber,
        },
      });
      return;
    }

    navigation.navigate('PatientDetails', {
      doctor,
      schedule: currentSchedule,
      session: sessionData,
      tokenNumber: slot.tokenNumber,
    });
  };

  const handleJoinWaitingList = async () => {
    if (!currentSchedule) return;

    if (isCurrentSessionExpired) {
      showWarning(
        'This consultation session has ended. Waiting list is closed.',
        'Session Ended'
      );
      return;
    }

    const sessionData = activeSession || {
      _id: currentSchedule._id,
      name: 'Consultation',
    };

    if (!isAuthenticated) {
      navigation.navigate('Login', {
        returnScreen: 'BookSlot',
        returnParams: { doctorId },
        pendingWaitingList: {
          scheduleId: currentSchedule._id,
          sessionId: sessionData._id,
          doctor: doctor._id,
          hospital: currentSchedule.location?._id || currentSchedule.location,
          date: currentSchedule.date,
        },
      });
      return;
    }

    setJoiningWaitingList(true);
    try {
      const res = await waitingListService.joinWaitingList({
        scheduleId: currentSchedule._id,
        sessionId: sessionData._id,
        doctor: doctor._id,
        hospital: currentSchedule.location?._id || currentSchedule.location,
        date: currentSchedule.date,
        patient: {
          name: user?.name || 'Patient',
          age: 28,
          gender: 'female',
          phone: '+91 98765 43210',
        },
      });

      const position = res.data?.entry?.position || 1;
      const sessionNotice = sessionData.name && sessionData.name !== 'Consultation' ? ` (${sessionData.name})` : '';

      showSuccess(
        `You are #${position} in the waiting list for ${doctor.name}${sessionNotice} on ${currentSchedule.date}. If any confirmed appointment is cancelled, you will be automatically promoted and assigned a token.`,
        'Waiting List Joined',
        () => navigation.navigate('Home')
      );
    } catch (error) {
      showError(error, 'Waiting List Notice');
    } finally {
      setJoiningWaitingList(false);
    }
  };

  if (loading || !doctor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <UserLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Booking Title Row with Back Button */}
        <View style={styles.bookingTitleRow}>
          <TouchableOpacity style={styles.backBtnCircle} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.bookingPageTitle}>Book Your Slot</Text>
        </View>

        {/* Doctor Summary Card */}
        <View style={styles.doctorSummaryRow}>
          <AppImage
            source={doctor.image}
            fallbackType="doctor"
            gender={doctor.gender || 'male'}
            style={styles.doctorPhoto}
            imageStyle={{ borderRadius: RADIUS.md }}
            iconSize={42}
          />
          <View style={styles.doctorSummaryInfo}>
            <Text style={styles.docName}>{doctor.name}</Text>
            <Text style={styles.docQualification}>{doctor.qualification}</Text>
            <Text style={styles.docSpec}>{doctor.specialization}</Text>
            <Text style={styles.docFee}>Fee: ₹{currentFee}</Text>
          </View>
        </View>

        {/* Available Days Section */}
        <AvailableDays
          schedules={schedules}
          selectedIndex={selectedScheduleIndex}
          onSelectDate={(idx) => {
            setSelectedScheduleIndex(idx);
            setSelectedSessionIndex(0); // Reset session tab when date changes
          }}
        />

        {/* Consultation Hours Display */}
        {currentSchedule && (
          <View style={styles.hoursCard}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.hoursTitle}>Consultation Hours: </Text>
            <Text style={styles.hoursVal}>{consultationHoursText}</Text>
          </View>
        )}

        {/* Availability / Waiting List / Expiry Logic */}
        {isDoctorUnavailable ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.notAvailable} />
            <Text style={styles.emptyStateTitle}>Doctor is unavailable on this date.</Text>
            <Text style={styles.emptyStateSub}>Please select another date from the bar above.</Text>
          </View>
        ) : isCurrentSessionExpired ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="time-outline" size={40} color={COLORS.notAvailable} />
            <Text style={styles.emptyStateTitle}>This consultation session has ended.</Text>
            <Text style={styles.emptyStateSub}>Token booking is no longer available for this session.</Text>
          </View>
        ) : isSessionUnavailable ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="alert-circle-outline" size={40} color={COLORS.notAvailable} />
            <Text style={styles.emptyStateTitle}>This session is currently unavailable.</Text>
            <Text style={styles.emptyStateSub}>Please choose another consultation session or date.</Text>
          </View>
        ) : isAllBooked ? (
          <View style={styles.fullSlotBox}>
            <Ionicons name="time-outline" size={40} color="#D97706" />
            <Text style={styles.fullSlotTitle}>No slots available for this session.</Text>
            <Text style={styles.fullSlotSub}>
              All {activeSession ? activeSession.totalTokens : currentSchedule.totalTokens} tokens have been booked. You can join the waiting list (up to 5 patients) to get promoted if a slot frees up.
            </Text>

            <TouchableOpacity
              style={[styles.waitingListBtn, joiningWaitingList && styles.btnDisabled]}
              onPress={handleJoinWaitingList}
              disabled={joiningWaitingList}
              activeOpacity={0.85}
            >
              {joiningWaitingList ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="people" size={18} color={COLORS.white} />
                  <Text style={styles.waitingListText}>Join Waiting List</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Dynamic Consultation Session Tabs (Only shown if > 1 session exists) */}
            {availableSessions.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sessionScroll}
                contentContainerStyle={styles.sessionContainer}
              >
                {availableSessions.map((sess, idx) => {
                  const isActive = activeSessionIndex === idx;
                  return (
                    <TouchableOpacity
                      key={sess._id || idx}
                      style={[styles.sessionBtn, isActive && styles.sessionBtnActive]}
                      onPress={() => setSelectedSessionIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.sessionTextTitle, isActive && styles.sessionTextTitleActive]}>
                        {sess.name || `Session ${idx + 1}`}
                      </Text>
                      <Text style={[styles.sessionTextTime, isActive && styles.sessionTextTimeActive]}>
                        {sess.startTime} - {sess.endTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Instruction Note */}
            <Text style={styles.tokenSectionNote}>
              Tap on any available queue token number to book:
            </Text>

            {/* Token Grid */}
            <TokenGrid
              slots={displayedSlots}
              selectedToken={selectedTokenSlot?.tokenNumber}
              onSelectToken={handleTokenSelect}
            />
          </>
        )}
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bookingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  backBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bookingPageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  doctorSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  doctorPhoto: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    backgroundColor: '#E2E8F0',
  },
  doctorSummaryInfo: {
    marginLeft: 14,
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  docQualification: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  docSpec: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  docFee: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: 3,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  hoursTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  hoursVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sessionScroll: {
    marginBottom: 14,
  },
  sessionContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 6,
  },
  sessionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    minWidth: 120,
  },
  sessionBtnActive: {
    backgroundColor: '#2B57B2',
  },
  sessionTextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sessionTextTitleActive: {
    color: COLORS.white,
  },
  sessionTextTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  sessionTextTimeActive: {
    color: '#E0E7FF',
  },
  tokenSectionNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyStateBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 10,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  fullSlotBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 10,
  },
  fullSlotTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 10,
  },
  fullSlotSub: {
    fontSize: 12,
    color: '#78350F',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  waitingListBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  waitingListText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});
