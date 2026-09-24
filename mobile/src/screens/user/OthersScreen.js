import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { HealthcareServiceCard } from '../../components/user/HealthcareServiceCard';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { healthcareService } from '../../services';
import { buildHomeServices } from '../../constants/healthcareServices';
import { appCache } from '../../utils/cache';

/**
 * OthersScreen
 *
 * Shows all active Admin-managed healthcare categories (i.e., everything
 * that is NOT Hospitals or Clinics). These are dynamically fetched from the
 * backend and are never hardcoded.
 *
 * Tapping a category navigates to FacilityCategory to filter facilities.
 */
export const OthersScreen = ({ navigation, route }) => {
  const passedServices = route.params?.othersServices || [];
  const cachedOthers = appCache.get('healthcare:others_services')?.data || passedServices;

  const [services, setServices] = useState(cachedOthers);
  const [loading, setLoading] = useState(cachedOthers.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    try {
      const res = await healthcareService.getActiveServices();
      const list = res?.data?.services || [];
      const { othersServices } = buildHomeServices(list);
      setServices(othersServices);
      appCache.set('healthcare:others_services', othersServices, 10 * 60 * 1000);
    } catch (err) {
      console.log('OthersScreen fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleServicePress = (service) => {
    navigation.navigate('FacilityCategory', {
      facilityType: service.facilityType || service.slug || 'others',
      categoryTitle: service.name || 'Healthcare Facilities',
    });
  };

  // Responsive 3-column grid
  const availableWidth = Math.min(width, 480) - 32;
  const gap = 10;
  const cardWidth = Math.floor((availableWidth - gap * 2) / 3);

  return (
    <UserLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadServices(true)} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Healthcare Services</Text>
        </View>

        <Text style={styles.subtitle}>
          Browse all additional healthcare categories available in your area.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="apps-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Additional Categories</Text>
            <Text style={styles.emptySubtitle}>
              No extra service categories have been added by the administrator yet. 
              Check back soon.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countLabel}>
              {services.length} {services.length === 1 ? 'Category' : 'Categories'}
            </Text>
            <View style={[styles.grid, { gap }]}>
              {services.map((service) => (
                <HealthcareServiceCard
                  key={service._id || service.slug || service.name}
                  service={service}
                  onPress={handleServicePress}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
    marginTop: 4,
    marginLeft: 48,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
