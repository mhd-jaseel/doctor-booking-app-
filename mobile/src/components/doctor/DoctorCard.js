import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '../common/AppImage';
import { COLORS, SHADOWS, RADIUS } from '../../constants/theme';

export const DoctorCard = ({ doctor, onPress, onBookPress }) => {
  const isAvailable = doctor.todayAvailability?.isAvailable;
  const availableSlots = doctor.todayAvailability?.availableSlots || 0;
  const dateFormatted = doctor.todayAvailability?.dateFormatted || 'Today';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.contentRow}>
        {/* Doctor Avatar */}
        <View style={styles.imageContainer}>
          <AppImage
            source={doctor.image}
            fallbackType="doctor"
            gender={doctor.gender || 'male'}
            style={styles.image}
            imageStyle={{ borderRadius: RADIUS.md }}
            iconSize={42}
          />
        </View>

        {/* Doctor Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={styles.qualification}>{doctor.qualification}</Text>
          <Text style={styles.specialization}>{doctor.specialization}</Text>

          {/* Availability Status Pills */}
          {isAvailable ? (
            <View style={styles.availabilitySection}>
              {/* Today Available Pill */}
              <View style={styles.datePill}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.dateText}>Today Available</Text>
              </View>

              {/* Available Slots Button */}
              <TouchableOpacity
                style={styles.availableSlotsButton}
                onPress={onBookPress || onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.availableSlotsText}>Available slots : {availableSlots}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notAvailableSection}>
              <View style={styles.notAvailablePill}>
                <Ionicons name="close-circle" size={13} color={COLORS.white} style={{ marginRight: 4 }} />
                <Text style={styles.notAvailableText}>Today Not Available</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  contentRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 90,
    height: 95,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  qualification: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  specialization: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  availabilitySection: {
    marginTop: 6,
  },
  datePill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  availableSlotsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  availableSlotsText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  notAvailableSection: {
    marginTop: 10,
  },
  notAvailablePill: {
    flexDirection: 'row',
    backgroundColor: COLORS.notAvailable,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  notAvailableText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
});
