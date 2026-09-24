import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppImage } from '../../components/common/AppImage';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { doctorService } from '../../services';
import { appCache } from '../../utils/cache';

export const DoctorDetailScreen = ({ navigation, route }) => {
  const { doctorId } = route.params || {};

  const cachedDoctor = doctorId ? appCache.get(`doctor:detail:${doctorId}`)?.data : null;

  const [doctor, setDoctor] = useState(cachedDoctor);
  const [loading, setLoading] = useState(!cachedDoctor);

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  const loadDoctor = async () => {
    try {
      const res = await doctorService.getDoctorById(doctorId);
      const fetchedDoctor = res.data?.doctor;
      if (fetchedDoctor) {
        setDoctor(fetchedDoctor);
        if (doctorId) {
          appCache.set(`doctor:detail:${doctorId}`, fetchedDoctor);
        }
      }
    } catch (error) {
      console.log('Error loading doctor details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctor) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <UserLayout>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Back Row */}
        <View style={styles.topBackRow}>
          <TouchableOpacity style={styles.backBtnCircle} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.docNavTitle} numberOfLines={1}>{doctor.name}</Text>
        </View>

        {/* Doctor Header Card */}
        <View style={styles.doctorHeaderCard}>
          <AppImage
            source={doctor.image}
            fallbackType="doctor"
            gender={doctor.gender || 'male'}
            style={styles.doctorPhoto}
            imageStyle={{ borderRadius: RADIUS.md }}
            iconSize={48}
          />
          <View style={styles.doctorHeaderInfo}>
            <Text style={styles.docName}>{doctor.name}</Text>
            <Text style={styles.docQual}>{doctor.qualification}</Text>
            <Text style={styles.docSpec}>{doctor.specialization}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Text style={styles.ratingVal}>{doctor.rating ? doctor.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.ratingCount}>
                {doctor.ratingCount ? `(${doctor.ratingCount}+ patients)` : '(No ratings yet)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{doctor.experience ? `${doctor.experience}+ Yrs` : 'N/A'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{doctor.consultationFee !== undefined ? `₹${doctor.consultationFee}` : 'Standard'}</Text>
            <Text style={styles.statLabel}>Consultation Fee</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {doctor.hospitals ? doctor.hospitals.length : 0}
            </Text>
            <Text style={styles.statLabel}>Facilities</Text>
          </View>
        </View>

        {/* About Doctor */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            {doctor.about ||
              `${doctor.name} is a specialist in ${doctor.specialization} providing outpatient consultations.`}
          </Text>
        </View>

        {/* Consultation Modes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Available Consultation Modes</Text>
          <View style={styles.modesRow}>
            <View style={styles.modePill}>
              <Ionicons name="business-outline" size={16} color={COLORS.primary} />
              <Text style={styles.modeText}>Hospital / Clinic OPD</Text>
            </View>
          </View>
        </View>

        {/* Practicing Facilities */}
        {doctor.hospitals && doctor.hospitals.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Practicing Facilities</Text>
            {doctor.hospitals.map((hosp, idx) => (
              <View key={idx} style={styles.hospItem}>
                <Ionicons name="medkit-outline" size={18} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.hospName}>{hosp.name || 'Healthcare Facility'}</Text>
                  <Text style={styles.hospCity}>{hosp.city || ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('BookSlot', { doctorId: doctor._id })}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
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
  docNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  doctorHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
    marginBottom: 16,
  },
  doctorPhoto: {
    width: 90,
    height: 95,
    borderRadius: RADIUS.lg,
    backgroundColor: '#E2E8F0',
  },
  doctorHeaderInfo: {
    marginLeft: 14,
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  docQual: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  docSpec: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.borderLight,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    ...SHADOWS.subtle,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 6,
  },

  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  hospItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  hospName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hospCity: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});
