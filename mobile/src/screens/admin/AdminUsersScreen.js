import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import { AdminUserCard } from '../../components/admin/users/AdminUserCard';
import { AdminPagination } from '../../components/common/AdminPagination';
import { useAppAlert } from '../../components/common/AppAlert';

export const AdminUsersScreen = ({ navigation }) => {
  const { users, page, setPage, search, setSearch, pagination, loading, toggleUserStatus } = useAdminUsers(10);
  const { showSuccess, showError, showConfirm } = useAppAlert();

  const handleToggle = (u) => {
    showConfirm({
      title: 'Update User Status?',
      message: `${u.isActive ? 'Deactivate' : 'Activate'} user account for ${u.email}?`,
      confirmText: u.isActive ? 'Deactivate' : 'Activate',
      isDestructive: u.isActive,
      onConfirm: async () => {
        try {
          await toggleUserStatus(u._id);
          showSuccess('User account status updated successfully.', 'Status Updated');
        } catch (e) {
          showError(e, 'Status Update Error');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Manage Users" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          Registered Users ({pagination.totalItems || users.length})
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search users by email or name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>No users found matching query.</Text>
        ) : (
          users.map((u) => (
            <AdminUserCard
              key={u._id}
              user={u}
              onToggleStatus={handleToggle}
            />
          ))
        )}

        <AdminPagination pagination={pagination} onPageChange={setPage} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  search: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginVertical: 24,
  },
});
