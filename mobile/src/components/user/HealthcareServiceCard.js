import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

// Displays a clickable icon card for healthcare services like Clinic or Hospital.
const ICON_MAP = {
  hospital: 'business',
  clinic: 'medkit',
  medical: 'medical',
  heart: 'heart',
  stethoscope: 'pulse',
  pharmacy: 'bandage',
  laboratory: 'flask',
  doctor: 'person',
  ambulance: 'car',
  dental: 'happy',
  eye: 'eye',
  child: 'people',
  // Others / generic
  apps: 'apps',
  grid: 'grid',
  others: 'apps',
  services: 'apps',
  more: 'ellipsis-horizontal-circle',
};

export const HealthcareServiceCard = ({ service, onPress, cardWidth }) => {
  const iconName = ICON_MAP[service.icon] || service.icon || 'medical';
  const displayName = service.name || service.label || 'Service';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: service.bgColor || '#F8FAFC',
          borderColor: service.borderColor || '#E2E8F0',
        },
      ]}
      onPress={() => onPress(service)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: service.color || COLORS.primary }]}>
        <Ionicons name={iconName} size={20} color={COLORS.white} />
      </View>

      <Text style={styles.title} numberOfLines={2} textBreakStrategy="balanced">
        {displayName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 98,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
