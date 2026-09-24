import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthcareServiceCard } from './HealthcareServiceCard';
import { healthcareService } from '../../services';
import { COLORS } from '../../constants/theme';
import { appCache } from '../../utils/cache';
import {
  DEFAULT_HEALTHCARE_SERVICES,
  buildHomeServices,
} from '../../constants/healthcareServices';

/**
 * HealthcareServicesSection
 *
 * Always shows exactly 3 hardcoded Home categories:
 *   1. Hospitals
 *   2. Clinics
 *   3. Others  ← umbrella for all Admin-managed categories
 *
 * Tapping "Others" navigates to OthersScreen which lists all active
 * Admin-managed healthcare categories dynamically.
 * Tapping "View All" also opens OthersScreen.
 */
export const HealthcareServicesSection = ({ onServicePress }) => {
  const [homeCards, setHomeCards] = useState(DEFAULT_HEALTHCARE_SERVICES);
  const [othersServices, setOthersServices] = useState(
    appCache.get('healthcare:others_services')?.data || []
  );

  const { width } = useWindowDimensions();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await healthcareService.getActiveServices();
      const list = res?.data?.services || [];
      const { homeCards: cards, othersServices: others } = buildHomeServices(list);
      setHomeCards(cards);
      setOthersServices(others);
      appCache.set('healthcare:home_cards', cards, 10 * 60 * 1000);
      appCache.set('healthcare:others_services', others, 10 * 60 * 1000);
    } catch (err) {
      console.log('Healthcare services fetch note (fallback to defaults):', err.message);
      setHomeCards(DEFAULT_HEALTHCARE_SERVICES);
    }
  };

  // Responsive 3-column width calculation
  // Screen padding: 16px × 2 = 32; gaps between 3 cards: 10px × 2 = 20
  const availableWidth = Math.min(width, 480) - 32;
  const gap = 10;
  const cardWidth = Math.floor((availableWidth - gap * 2) / 3);

  // Always show exactly the 3 home cards
  const hasOthers = othersServices.length > 0;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Healthcare Services</Text>
        {hasOthers && (
          <TouchableOpacity
            onPress={() => onServicePress({ isOthers: true, name: 'Others', othersServices })}
            activeOpacity={0.7}
            style={styles.viewToggleBtn}
          >
            <Text style={styles.viewToggleText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed 3-Column Grid: Hospitals | Clinics | Others */}
      <View style={[styles.grid, { gap }]}>
        {homeCards.map((service) => (
          <HealthcareServiceCard
            key={service._id || service.slug || service.name}
            service={service}
            onPress={onServicePress}
            cardWidth={cardWidth}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});
