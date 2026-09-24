import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppImage } from '../../components/common/AppImage';
import { HealthcareServicesSection } from '../../components/user/HealthcareServicesSection';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { doctorService, appointmentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { appCache } from '../../utils/cache';
export const HomeScreen = ({ navigation }) => {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Immediate Cache Initialization
  const cachedHomeDocs = appCache.get('home:top_doctors')?.data || [];
  const cachedActiveApp = user?._id ? appCache.get(`appointments:active:${user._id}`)?.data : null;

  const [activeBooking, setActiveBooking] = useState(cachedActiveApp);
  const [doctors, setDoctors] = useState(cachedHomeDocs);
  const [loading, setLoading] = useState(cachedHomeDocs.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, [isAuthenticated]);

  // Sync polling removed

  const loadHomeData = async (isBackgroundSync = false) => {
    try {
      if (!isBackgroundSync && doctors.length === 0) {
        setLoading(true);
      }
      setLoadError(null);

      const promises = [doctorService.getDoctors({ limit: 6 })];
      if (isAuthenticated) {
        promises.push(appointmentService.getMyAppointments({ status: 'confirmed' }));
      }

      const results = await Promise.allSettled(promises);
      const docsRes = results[0];
      const appsRes = results[1];

      if (docsRes?.status === 'fulfilled') {
        const fetchedDocs = docsRes.value?.data?.doctors || [];
        setDoctors(fetchedDocs);
        if (fetchedDocs.length > 0) {
          appCache.set('home:top_doctors', fetchedDocs);
        }
      } else if (docsRes?.status === 'rejected') {
        console.log('[Home] Doctor fetch error:', docsRes.reason?.message);
        if (doctors.length === 0) {
          setLoadError(docsRes.reason?.message || 'Unable to load doctors');
        }
      }

      if (appsRes?.status === 'fulfilled') {
        const activeApps = appsRes.value?.data?.appointments || [];
        const latestActive = activeApps.length > 0 ? activeApps[0] : null;
        setActiveBooking(latestActive);
        if (user?._id) {
          appCache.set(`appointments:active:${user._id}`, latestActive);
        }
      } else if (!isAuthenticated) {
        setActiveBooking(null);
      }
    } catch (error) {
      console.log('Home data load error:', error.message);
      if (doctors.length === 0) {
        setLoadError(error.message || 'Unable to load doctors');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('AvailableDoctors', { search: searchQuery.trim() });
    }
  };

  const handleServicePress = (service) => {
    if (service.isOthers) {
      // Navigate to OthersScreen which shows all active Admin-managed categories
      navigation.navigate('OthersServices', {
        othersServices: service.othersServices || [],
      });
      return;
    }
    navigation.navigate('FacilityCategory', {
      facilityType: service.facilityType || service.slug || 'hospital',
      categoryTitle: service.name || service.label || 'Healthcare Facilities',
    });
  };


  return (
    <UserLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialities or clinics..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Today's Booking Banner */}
        {activeBooking ? (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.bookingTitle}>Today's Booking</Text>
                <Text style={styles.patientName}>Patient: {activeBooking.patient?.name}</Text>
              </View>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeNumber}>#{activeBooking.tokenNumber}</Text>
                <Text style={styles.tokenBadgeLabel}>TOKEN</Text>
              </View>
            </View>

            <View style={styles.bookingDivider} />

            <View style={styles.bookingDetailsRow}>
              <View style={styles.docInfo}>
                <Text style={styles.bookingDoctorName}>{activeBooking.doctor?.name ? `Dr. ${activeBooking.doctor.name.replace(/^dr\.?\s*/i, '')}` : 'Doctor'}</Text>
                <Text style={styles.bookingHospitalName}>
                  {activeBooking.hospital?.name || 'Healthcare Facility'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyBookingCard}>
            <View style={styles.emptyBookingLeft}>
              <Text style={styles.emptyBookingTitle}>No Active Booking</Text>
              <Text style={styles.emptyBookingSub}>Book a consultation slot with top doctors today</Text>
            </View>
            <TouchableOpacity
              style={styles.bookNowSmallBtn}
              onPress={() => navigation.navigate('AvailableDoctors')}
            >
              <Text style={styles.bookNowSmallText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Healthcare Services: 3-Column Grid with View All / View Less */}
        <HealthcareServicesSection onServicePress={handleServicePress} />

        {/* 3. Best Doctors Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Doctors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AvailableDoctors')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : loadError && doctors.length === 0 ? (
          <View style={styles.emptyDoctorContainer}>
            <Ionicons name="cloud-offline-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyDoctorText}>Unable to load doctors</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadHomeData(false)}>
              <Ionicons name="refresh" size={14} color={COLORS.white} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : doctors.length === 0 ? (
          <View style={styles.emptyDoctorContainer}>
            <Ionicons name="medical-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyDoctorText}>No doctors available</Text>
          </View>
        ) : (
          <View style={styles.doctorsList}>
            {doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor._id}
                style={styles.doctorItem}
                onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor._id })}
                activeOpacity={0.85}
              >
                <AppImage
                  source={doctor.image}
                  fallbackType="doctor"
                  gender={doctor.gender || 'male'}
                  style={styles.doctorAvatar}
                  imageStyle={{ borderRadius: 28 }}
                  iconSize={28}
                />
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorItemName} numberOfLines={1}>
                    {doctor.name}
                  </Text>
                  <Text style={styles.doctorItemSpec}>{doctor.specialization}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{doctor.rating ? doctor.rating.toFixed(1) : 'New'}</Text>
                    <Text style={styles.ratingCount}>
                      {doctor.ratingCount ? `(${doctor.ratingCount}+ reviews)` : '(No ratings yet)'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    padding: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    ...SHADOWS.subtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.card,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  tokenBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tokenBadgeNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  tokenBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0E7FF',
    letterSpacing: 0.5,
  },
  bookingDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 12,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  bookingDoctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bookingHospitalName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  emptyBookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  emptyBookingLeft: {
    flex: 1,
  },
  emptyBookingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyBookingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bookNowSmallBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  bookNowSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  doctorsList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  doctorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  doctorItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  doctorItemSpec: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyDoctorContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
    marginVertical: 6,
  },
  emptyDoctorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
