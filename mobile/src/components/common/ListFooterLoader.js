import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

export const ListFooterLoader = ({
  loadingMore,
  hasNextPage,
  onLoadMore,
  totalItems,
}) => {
  if (loadingMore) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }

  if (hasNextPage && onLoadMore) {
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} activeOpacity={0.8}>
        <Text style={styles.loadMoreText}>Load More</Text>
      </TouchableOpacity>
    );
  }

  if (totalItems > 0 && !hasNextPage) {
    return (
      <View style={styles.endContainer}>
        <Text style={styles.endText}>Showing all {totalItems} items</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  loadMoreBtn: {
    paddingVertical: 12,
    marginVertical: 10,
    backgroundColor: COLORS.primarySubtle,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6FC',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  endContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  endText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
