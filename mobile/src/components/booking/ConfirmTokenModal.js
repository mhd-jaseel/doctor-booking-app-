import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AppButton } from '../common/AppButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export const ConfirmTokenModal = ({
  visible,
  tokenSlot,
  doctor,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!tokenSlot) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Heading */}
          <Text style={styles.title}>CONFIRM TOKEN</Text>
          <Text style={styles.subtitle}>Are you sure you want to book this slot?</Text>

          {/* Token Card Preview */}
          <View style={styles.tokenCard}>
            <Text style={styles.tokenNumber}>{tokenSlot.tokenNumber}</Text>
            <Text style={styles.tokenTime}>{tokenSlot.time}</Text>
          </View>

          {/* Confirm Button */}
          <AppButton
            title="CONFIRM"
            loadingTitle="BOOKING..."
            loading={loading}
            onPress={onConfirm}
            size="lg"
            style={{ width: '100%', marginBottom: 12 }}
          />

          {/* Cancel Text Link */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, loading && { opacity: 0.5 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
    ...SHADOWS.modal,
  },
  grabHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  tokenCard: {
    width: '65%',
    backgroundColor: COLORS.primarySubtle,
    borderRadius: RADIUS.lg,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#DCE6FC',
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  tokenTime: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
