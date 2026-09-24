import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserLayout } from '../../components/common/UserLayout';
import { ListFooterLoader } from '../../components/common/ListFooterLoader';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { notificationService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { usePaginatedList } from '../../hooks/usePaginatedList';

export const NotificationsScreen = ({ navigation }) => {
  const { isAuthenticated, user } = useAuth();

  const {
    items: notifications,
    loading,
    refreshing,
    loadingMore,
    pagination,
    refresh,
    loadMore,
  } = usePaginatedList(notificationService.getNotifications, {
    itemsKey: 'notifications',
    initialLimit: 10,
    appendMode: true,
    cacheKeyPrefix: user?._id ? `notifications:user:${user._id}` : null,
    autoSyncResources: ['notifications', 'appointments', 'tokens'],
    autoSyncInterval: 8000,
  });

  const handleNotificationClick = async (notif) => {
    try {
      await notificationService.markAsRead(notif._id);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <UserLayout>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={refresh}
          ListFooterComponent={<ListFooterLoader loading={loadingMore} hasMore={pagination?.hasNextPage} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => handleNotificationClick(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name={
                    item.type?.includes('confirmed')
                      ? 'checkmark-circle'
                      : item.type?.includes('cancelled')
                      ? 'close-circle'
                      : 'notifications'
                  }
                  size={24}
                  color={item.type?.includes('cancelled') ? COLORS.notAvailable : COLORS.primary}
                />
              </View>

              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>

              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !isAuthenticated ? (
              <View style={styles.centerContainer}>
                <Ionicons name="lock-closed-outline" size={54} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>Please Sign In</Text>
                <Text style={styles.emptySub}>
                  Sign in to view your appointment updates and waiting list alerts.
                </Text>
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => navigation.navigate('Login', { returnScreen: 'Notifications' })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
                  <Text style={styles.signInBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Ionicons name="notifications-off-outline" size={54} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Notifications</Text>
              </View>
            )
          }
        />
      )}
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  cardUnread: {
    backgroundColor: '#F0F5FF',
    borderColor: '#DCE6FC',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  message: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 16,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    marginTop: 18,
    gap: 6,
  },
  signInBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
