import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { ListFooterLoader } from '../../components/common/ListFooterLoader';
import { COLORS, RADIUS } from '../../constants/theme';
import { SPECIALIZATION_TAGS } from '../../constants/config';
import { doctorService } from '../../services';
import { usePaginatedList } from '../../hooks/usePaginatedList';

export const AvailableDoctorsScreen = ({ navigation, route }) => {
  const { mode, hospitalId, title: routeTitle } = route?.params || {};
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    items: doctors,
    loading,
    refreshing,
    loadingMore,
    pagination,
    refresh,
    loadMore,
    updateFilters,
  } = usePaginatedList(doctorService.getDoctors, {
    itemsKey: 'doctors',
    initialFilters: {
      ...(mode ? { mode } : {}),
      ...(hospitalId ? { hospitalId } : {}),
    },
    initialLimit: 10,
    appendMode: true,
    cacheKeyPrefix: 'doctors:user:list',
    autoSyncResources: ['doctors', 'facilities', 'doctorFacilities'],
    autoSyncInterval: 8000,
  });

  // Whenever filter selection or search query updates, push new filters to the paginated list
  React.useEffect(() => {
    const filters = {};
    if (mode) filters.mode = mode;
    if (hospitalId) filters.hospitalId = hospitalId;
    if (selectedTag && selectedTag !== 'ALL') {
      filters.specialization = selectedTag;
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    updateFilters(filters);
  }, [selectedTag, searchQuery, mode, hospitalId, updateFilters]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <UserLayout>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.pageTitle}>{routeTitle || 'Available Doctors'}</Text>

        {/* Specialization Filter Pills (Exact Screenshot Match) */}
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
            {SPECIALIZATION_TAGS.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isSelected && styles.tagPillActive]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search Bar with Clear 'X' Icon */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Doctors.."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Doctors List */}
        {loading && doctors.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshing={refreshing}
            onRefresh={refresh}
            ListFooterComponent={
              <ListFooterLoader
                loadingMore={loadingMore}
                hasNextPage={pagination?.hasNextPage}
                onLoadMore={loadMore}
                totalItems={pagination?.totalItems}
              />
            }
            renderItem={({ item }) => (
              <DoctorCard
                doctor={item}
                onPress={() => navigation.navigate('BookSlot', { doctorId: item._id })}
                onBookPress={() => navigation.navigate('BookSlot', { doctorId: item._id })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No doctors found</Text>
              </View>
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
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  tagPill: {
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: COLORS.white,
  },
  tagPillActive: {
    borderColor: '#D92D20',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#667085',
    letterSpacing: 0.4,
  },
  tagTextActive: {
    color: '#D92D20',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
    backgroundColor: COLORS.white,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
