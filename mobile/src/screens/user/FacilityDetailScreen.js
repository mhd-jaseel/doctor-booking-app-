import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppImage } from '../../components/common/AppImage';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { hospitalService, doctorService } from '../../services';
import { appCache } from '../../utils/cache';

export const FacilityDetailScreen = ({ navigation, route }) => {
  const { facilityId } = route.params || {};

  const cachedData = facilityId ? appCache.get(`facility:detail:${facilityId}`)?.data : null;

  const [facility, setFacility] = useState(cachedData?.facility || null);
  const [doctors, setDoctors] = useState(cachedData?.doctors || []);
  const [loading, setLoading] = useState(!cachedData?.facility);

  useEffect(() => {
    loadFacilityAndDoctors();
  }, [facilityId]);

  const loadFacilityAndDoctors = async () => {
    try {
      const [facRes, docsRes] = await Promise.allSettled([
        hospitalService.getHospitalById(facilityId),
        doctorService.getDoctorsByHospital(facilityId),
      ]);

      let fetchedFacility = null;
      let fetchedDoctors = [];

      if (facRes.status === 'fulfilled') {
        fetchedFacility = facRes.value.data?.hospital;
        setFacility(fetchedFacility);
      }
      if (docsRes.status === 'fulfilled') {
        fetchedDoctors = docsRes.value.data?.doctors || [];
        setDoctors(fetchedDoctors);
      }

      if (fetchedFacility && facilityId) {
        appCache.set(`facility:detail:${facilityId}`, {
          facility: fetchedFacility,
          doctors: fetchedDoctors,
        });
      }
    } catch (error) {
      console.log('Error loading facility details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !facility) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <UserLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back Button Banner Overlay */}
        <View style={styles.topBackRow}>
          <TouchableOpacity style={styles.backBtnCircle} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.facilityNavTitle} numberOfLines={1}>{facility.name}</Text>
        </View>

        {/* Banner Image */}
        <AppImage
          source={facility.image}
          fallbackType="facility"
          style={styles.bannerImg}
          imageStyle={{ borderRadius: RADIUS.md }}
          iconSize={64}
        />

        {/* Facility Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {facility.facilityType ? facility.facilityType.replace('_', ' ').toUpperCase() : 'FACILITY'}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Text style={styles.ratingText}>{facility.rating ? facility.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.ratingCount}>
                {facility.ratingCount ? `(${facility.ratingCount}+ reviews)` : '(No ratings yet)'}
              </Text>
            </View>
          </View>

          <Text style={styles.facilityName}>{facility.name}</Text>
          <Text style={styles.facilitySubtype}>{facility.facilityType}</Text>

          {/* Description */}
          {facility.description ? (
            <Text style={styles.descriptionText}>{facility.description}</Text>
          ) : null}

          <View style={styles.divider} />

          {/* Key Details Rows */}
          <View style={styles.metaRow}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{facility.address}, {facility.city}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="call" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{facility.phone}</Text>
          </View>

          {facility.email ? (
            <View style={styles.metaRow}>
              <Ionicons name="mail" size={18} color={COLORS.primary} />
              <Text style={styles.metaText}>{facility.email}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="time" size={18} color={COLORS.primary} />
            <Text style={styles.metaText}>{facility.workingHours || '24/7 Service'}</Text>
          </View>

          {/* Features / Services Tags */}
          {facility.facilities && facility.facilities.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={styles.featuresHeading}>Available Services & Features</Text>
              <View style={styles.tagsGrid}>
                {facility.facilities.map((feature, idx) => (
                  <View key={idx} style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.featurePillText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Available Doctors Section */}
        <View style={styles.doctorsSectionHeader}>
          <Text style={styles.sectionHeading}>Available Doctors ({doctors.length})</Text>
        </View>

        {doctors.length === 0 ? (
          <View style={styles.noDoctorsCard}>
            <Ionicons name="medical-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.noDoctorsText}>No doctors currently assigned to this facility</Text>
          </View>
        ) : (
          doctors.map((doc) => (
            <DoctorCard
              key={doc._id}
              doctor={doc}
              onPress={() => navigation.navigate('DoctorDetail', { doctorId: doc._id })}
              onBookPress={() => navigation.navigate('DoctorDetail', { doctorId: doc._id })}
            />
          ))
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
  topBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  backBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerImg: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginTop: -20,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 20,
    ...SHADOWS.card,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  facilityName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  facilitySubtype: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  featuresSection: {
    marginTop: 12,
  },
  featuresHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  featurePillText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  doctorsSectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  noDoctorsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: RADIUS.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  noDoctorsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
