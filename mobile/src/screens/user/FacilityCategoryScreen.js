import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { AppImage } from '../../components/common/AppImage';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { hospitalService } from '../../services';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { ListFooterLoader } from '../../components/common/ListFooterLoader';

export const FacilityCategoryScreen = ({ navigation, route }) => {
  const { facilityType, categoryTitle } = route.params || {
    facilityType: 'hospital',
    categoryTitle: 'Hospitals',
  };

  const initialFilters = facilityType && facilityType !== 'ALL' ? { facilityType } : {};

  const {
    items: facilities,
    pagination,
    loading,
    loadingMore,
    refreshing,
    refresh,
    loadMore,
  } = usePaginatedList(hospitalService.getHospitals, {
    itemsKey: 'hospitals',
    initialFilters,
    initialLimit: 10,
    appendMode: true,
    cacheKeyPrefix: `facilities:category:${facilityType || 'ALL'}`,
    autoSyncResources: ['facilities', 'doctors', 'doctorFacilities'],
    autoSyncInterval: 10000,
  });

  const formatFacilityType = (type) => {
    if (!type) return 'FACILITY';
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <UserLayout>
      <View style={styles.content}>
        {/* Category Header Row with Back Button */}
        <View style={styles.categoryTitleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.categoryTitleText}>{categoryTitle || 'Healthcare Facilities'}</Text>
        </View>

        {/* Facility Cards List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={facilities}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.facilityCard}
                onPress={() => navigation.navigate('FacilityDetail', { facilityId: item._id })}
                activeOpacity={0.85}
              >
                <AppImage
                  source={item.image}
                  fallbackType="facility"
                  style={styles.facilityImg}
                  imageStyle={{ borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg }}
                  iconSize={48}
                />
                <View style={styles.facilityInfo}>
                  <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {formatFacilityType(item.facilityType)}
                      </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
                    </View>
                  </View>

                  <Text style={styles.facilityName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.cityText}>{item.address}, {item.city}</Text>
                  </View>

                  <View style={styles.timingRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.timingText}>{item.workingHours || 'Open Today'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No facilities found</Text>
                <Text style={styles.emptySub}>No active {categoryTitle?.toLowerCase() || 'facilities'} registered in this area.</Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              <ListFooterLoader
                loadingMore={loadingMore}
                hasNextPage={pagination.hasNextPage}
                onLoadMore={loadMore}
                totalItems={pagination.totalItems}
              />
            }
          />
        )}
      </View>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  categoryTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  facilityImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  facilityInfo: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timingText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
