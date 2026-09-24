import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const FormFieldError = ({ error, style }) => {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={14} color="#EF4444" style={styles.icon} />
      <Text style={styles.text}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
});
