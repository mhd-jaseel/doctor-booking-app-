import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserNavbar } from './UserNavbar';
import { COLORS } from '../../constants/theme';

/**
 * Global User Application Layout Wrapper
 * Renders the top UserNavbar (DoctorCare + Bell) and wraps the screen content.
 * UserBottomNavigation is mounted persistently at the navigator root level.
 */
export const UserLayout = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <UserNavbar />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
