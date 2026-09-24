import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserLayout } from '../../components/common/UserLayout';
import { ListFooterLoader } from '../../components/common/ListFooterLoader';
import { AppButton } from '../../components/common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { appointmentService, ratingService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../components/common/AppAlert';
import { usePaginatedList } from '../../hooks/usePaginatedList';

export const HistoryScreen = ({ navigation }) => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showConfirm } = useAppAlert();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

  // Rating Modal States
  const [ratingModalApp, setRatingModalApp] = useState(null);
  const [doctorRating, setDoctorRating] = useState(5);
  const [hospitalRating, setHospitalRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);

  const statusParam = useMemo(() => {
    return activeTab === 'upcoming'
      ? 'confirmed,in_progress'
      : activeTab === 'completed'
      ? 'completed'
      : 'cancelled';
  }, [activeTab]);

  const {
    items: appointments,
    loading,
    refreshing,
    loadingMore,
    pagination,
    refresh,
    loadMore,
    updateFilters,
  } = usePaginatedList(appointmentService.getMyAppointments, {
    itemsKey: 'appointments',
    initialFilters: { status: statusParam },
    initialLimit: 10,
    appendMode: true,
    cacheKeyPrefix: user?._id ? `appointments:user:${user._id}` : null,
    autoSyncResources: ['appointments', 'tokens', 'schedules', 'notifications'],
    autoSyncInterval: 6000,
  });

  useFocusEffect(
    useCallback(() => {
      updateFilters({ status: statusParam });
    }, [statusParam, updateFilters])
  );

  const handleCancelBooking = (appointmentId) => {
    showConfirm({
      title: 'Cancel Appointment?',
      message: 'Are you sure you want to cancel this booking? If there are waiting list patients, the freed slot will be automatically assigned.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Appointment',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await appointmentService.cancelAppointment(appointmentId);
          appCache.invalidatePrefix('appointments:');
          appCache.invalidatePrefix('schedules:');
          appCache.invalidatePrefix('admin:schedules');
          appCache.invalidatePrefix('notifications:');
          showSuccess('Your appointment has been cancelled successfully.', 'Appointment Cancelled');
          onRefresh();
        } catch (error) {
          showError(error, 'Cancellation Failed');
        }
      },
    });
  };

  const handleSubmitRating = async () => {
    if (!ratingModalApp) return;
    setSubmittingRating(true);
    try {
      await ratingService.submitRating({
        appointmentId: ratingModalApp._id,
        doctorRating,
        hospitalRating,
      });
      showSuccess('Thank you for sharing your healthcare feedback!', 'Rating Submitted');
      setRatingModalApp(null);
      onRefresh();
    } catch (error) {
      showError(error, 'Rating Error');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <UserLayout>
      {/* 3 Navigation Tabs: Upcoming | Completed | Cancelled */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'cancelled' && styles.tabBtnActive]}
          onPress={() => setActiveTab('cancelled')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {loading && appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'upcoming' ? appointments.filter(app => {
            const todayStr = new Date().toISOString().split('T')[0];
            if (app.date !== todayStr) return true;
            
            // For today's appointments, check session expiry
            const { isSessionExpired } = require('../../utils/dateTimeHelper');
            return !isSessionExpired(app.date, app.schedule?.endTime || '11:59 PM');
          }) : activeTab === 'completed' ? appointments.filter(app => {
            const todayStr = new Date().toISOString().split('T')[0];
            if (app.status === 'completed') return true;
            
            // Include today's expired appointments in completed
            if (app.date === todayStr) {
               const { isSessionExpired } = require('../../utils/dateTimeHelper');
               return isSessionExpired(app.date, app.schedule?.endTime || '11:59 PM');
            }
            return true;
          }) : appointments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={refresh}
          ListFooterComponent={<ListFooterLoader loading={loadingMore} hasMore={pagination?.hasNextPage} />}
          renderItem={({ item }) => {
            const isConfirmed = item.status === 'confirmed';
            const isInProgress = item.status === 'in_progress';
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>{item.doctor?.name ? `Dr. ${item.doctor.name.replace(/^dr\.?\s*/i, '')}` : 'Doctor'}</Text>
                    <Text style={styles.specialization}>{item.doctor?.specialization}</Text>
                    <Text style={styles.hospitalName}>
                      {item.hospital?.name || 'Healthcare Facility'}
                    </Text>
                  </View>

                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenNum}>#{item.tokenNumber}</Text>
                    <Text style={styles.tokenLbl}>TOKEN</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{item.date}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.metaPatient}>{item.patient?.name}</Text>
                  </View>
                </View>

                {/* Actions per tab state */}
                <View style={styles.actionRow}>
                  {isConfirmed && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelBooking(item._id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  )}

                  {isInProgress && (
                    <View style={styles.inProgressBadge}>
                      <Ionicons name="time-outline" size={14} color="#F59E0B" />
                      <Text style={styles.inProgressBadgeText}>In Progress</Text>
                    </View>
                  )}

                  {isCompleted && (
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => {
                        setDoctorRating(5);
                        setHospitalRating(5);
                        setRatingModalApp(item);
                      }}
                    >
                      <Ionicons name="star" size={15} color="#F59E0B" />
                      <Text style={styles.rateBtnText}>Rate Consultation</Text>
                    </TouchableOpacity>
                  )}

                  {isCancelled && (
                    <View style={styles.cancelledBadge}>
                      <Ionicons name="close-circle" size={14} color={COLORS.notAvailable} />
                      <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isAuthenticated ? (
              <View style={styles.centerContainer}>
                <Ionicons name="lock-closed-outline" size={54} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>Please Sign In</Text>
                <Text style={styles.emptySubtitle}>
                  Please login to view your upcoming and past consultation appointments.
                </Text>
                <TouchableOpacity
                  style={styles.guestLoginBtn}
                  onPress={() => navigation.navigate('Login', { returnScreen: 'History' })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
                  <Text style={styles.guestLoginBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons name="calendar-outline" size={54} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>
                  No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'upcoming'
                    ? 'Book a consultation slot with top doctors today'
                    : `Your ${activeTab} consultation history will appear here`}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* Star Rating Modal (Only Star Ratings, No Written Reviews - Requirement 28) */}
      <Modal visible={!!ratingModalApp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingTitle}>Rate Your Consultation</Text>
            <Text style={styles.ratingDoctorName}>{ratingModalApp?.doctor?.name}</Text>
            <Text style={styles.ratingHospName}>
              {ratingModalApp?.hospital?.name || 'Taluk Hospital Kuttippuram'}
            </Text>

            {/* Rate Doctor */}
            <Text style={styles.ratingCategoryTitle}>Rate Doctor</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={`doc-${star}`} onPress={() => setDoctorRating(star)}>
                  <Ionicons
                    name={star <= doctorRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Rate Hospital/Clinic */}
            <Text style={styles.ratingCategoryTitle}>Rate Hospital / Clinic</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={`hosp-${star}`} onPress={() => setHospitalRating(star)}>
                  <Ionicons
                    name={star <= hospitalRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <AppButton
              title="Submit Rating"
              loadingTitle="Submitting..."
              loading={submittingRating}
              onPress={handleSubmitRating}
              size="md"
              style={{ width: '100%', marginBottom: 8 }}
            />

            <TouchableOpacity
              style={styles.closeRatingBtn}
              onPress={() => !submittingRating && setRatingModalApp(null)}
              disabled={submittingRating}
            >
              <Text style={styles.closeRatingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  specialization: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  hospitalName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tokenBadge: {
    backgroundColor: COLORS.primarySubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6FC',
  },
  tokenNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  tokenLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metaPatient: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.notAvailable,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 12,
    color: COLORS.notAvailable,
    fontWeight: '700',
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  rateBtnText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelledBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.notAvailable,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  inProgressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
    marginTop: 18,
    gap: 6,
  },
  guestLoginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  ratingBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ratingDoctorName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  ratingHospName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  ratingCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  submitRatingBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeRatingBtn: {
    paddingVertical: 6,
  },
  closeRatingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
