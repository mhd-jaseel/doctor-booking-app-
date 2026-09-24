import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../../constants/theme';

export const AdminFormModal = ({ visible, children, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...SHADOWS.card,
  },
});
