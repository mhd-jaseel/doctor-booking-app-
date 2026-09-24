import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminHeader } from '../../components/common/AdminHeader';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAdminRatings } from '../../hooks/admin/useAdminRatings';
import { AdminPagination } from '../../components/common/AdminPagination';

export const AdminRatingsScreen = ({ navigation }) => {
  const { ratingsData, page, setPage, pagination, loading } = useAdminRatings(10);

  return (
    <View style={styles.container}>
      <AdminHeader title="Ratings & Feedback" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Doctor Ratings & Patient Feedback</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.subHeading}>Doctor Performance</Text>
              {(ratingsData.doctorRatings || []).map((d) => (
                <View key={d._id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{d.name}</Text>
                    <Text style={styles.meta}>{d.specialization}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingVal}>{(d.rating || 0).toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({d.ratingCount})</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.subHeading}>Facility Ratings</Text>
              {(ratingsData.hospitalRatings || []).map((h) => (
                <View key={h._id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{h.name}</Text>
                    <Text style={styles.meta}>{h.facilityType?.replace('_', ' ')} • {h.city}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingVal}>{(h.rating || 0).toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({h.ratingCount})</Text>
                  </View>
                </View>
              ))}
            </View>

            <AdminPagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  section: { marginBottom: 18 },
  subHeading: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  title: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, gap: 4 },
  ratingVal: { fontSize: 12, fontWeight: '900', color: '#D97706' },
  ratingCount: { fontSize: 10, color: COLORS.textMuted },
});
