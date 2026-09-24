import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

export const AdminPagination = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, totalItems, limit } = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  };

  if (!totalItems || totalPages <= 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.summaryText}>
          Showing {totalItems} of {totalItems} records
        </Text>
      </View>
    );
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers window (e.g. up to 5 buttons)
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <View style={styles.container}>
      <Text style={styles.summaryText}>
        Showing {startItem}–{endItem} of {totalItems}
      </Text>

      <View style={styles.controlsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={16}
            color={currentPage <= 1 ? COLORS.textMuted : COLORS.primary}
          />
          <Text style={[styles.navBtnText, currentPage <= 1 && styles.navBtnTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        {/* Numeric Page Buttons */}
        {pageNumbers.map((p) => {
          const isActive = p === currentPage;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.pageBtn, isActive && styles.pageBtnActive]}
              onPress={() => onPageChange(p)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pageBtnText, isActive && styles.pageBtnTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage >= totalPages && styles.navBtnDisabled]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navBtnText,
              currentPage >= totalPages && styles.navBtnTextDisabled,
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={currentPage >= totalPages ? COLORS.textMuted : COLORS.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: '#DCE6FC',
  },
  navBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.borderLight,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  navBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  pageBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pageBtnTextActive: {
    color: COLORS.white,
  },
});
