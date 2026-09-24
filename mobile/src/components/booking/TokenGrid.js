import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

export const TokenGrid = ({ slots = [], selectedToken, onSelectToken }) => {
  return (
    <View style={styles.gridContainer}>
      {slots.map((slot) => {
        const isSelected = selectedToken === slot.tokenNumber;
        const isBooked = slot.isBooked;

        return (
          <TouchableOpacity
            key={slot.tokenNumber}
            style={[
              styles.tokenCard,
              isSelected && styles.tokenCardSelected,
              isBooked && styles.tokenCardBooked,
            ]}
            onPress={() => !isBooked && onSelectToken(slot)}
            disabled={isBooked}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tokenNumber,
                isSelected && styles.tokenNumberSelected,
                isBooked && styles.tokenNumberBooked,
              ]}
            >
              {slot.tokenNumber}
            </Text>
            <Text
              style={[
                styles.tokenStatusText,
                isSelected && styles.tokenStatusTextSelected,
                isBooked && styles.tokenStatusTextBooked,
              ]}
              numberOfLines={1}
            >
              {isBooked ? 'Booked' : 'Token'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tokenCard: {
    width: '18%', // 5 tokens per row exactly matching the Royal Blue UI mockup
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tokenCardSelected: {
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  tokenCardBooked: {
    backgroundColor: '#E2E8F0',
  },
  tokenNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
  },
  tokenNumberSelected: {
    color: COLORS.white,
  },
  tokenNumberBooked: {
    color: COLORS.textMuted,
  },
  tokenStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tokenStatusTextSelected: {
    color: COLORS.white,
  },
  tokenStatusTextBooked: {
    color: COLORS.textMuted,
  },
});
