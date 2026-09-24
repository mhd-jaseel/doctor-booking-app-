import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { getErrorMessage } from '../../utils/errorHandler';

const AlertContext = createContext();

export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CONFIRM: 'confirm',
};

const ALERT_CONFIGS = {
  [ALERT_TYPES.SUCCESS]: {
    icon: 'checkmark-circle',
    color: '#059669',
    bgColor: '#ECFDF5',
    defaultTitle: 'Success',
    btnText: 'OK',
  },
  [ALERT_TYPES.ERROR]: {
    icon: 'close-circle',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    defaultTitle: 'Error',
    btnText: 'Dismiss',
  },
  [ALERT_TYPES.WARNING]: {
    icon: 'alert-circle',
    color: '#D97706',
    bgColor: '#FFFBEB',
    defaultTitle: 'Attention',
    btnText: 'Got It',
  },
  [ALERT_TYPES.INFO]: {
    icon: 'information-circle',
    color: '#2F65CB',
    bgColor: '#EFF6FF',
    defaultTitle: 'Notice',
    btnText: 'OK',
  },
  [ALERT_TYPES.CONFIRM]: {
    icon: 'help-circle',
    color: '#2F65CB',
    bgColor: '#EFF6FF',
    defaultTitle: 'Please Confirm',
    btnText: 'Confirm',
    cancelBtnText: 'Cancel',
  },
};

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    type: ALERT_TYPES.INFO,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null,
    onCancel: null,
    isDestructive: false,
  });

  const showAlert = useCallback(
    ({
      type = ALERT_TYPES.INFO,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      isDestructive = false,
    }) => {
      const config = ALERT_CONFIGS[type] || ALERT_CONFIGS[ALERT_TYPES.INFO];
      setAlertState({
        visible: true,
        type,
        title: title || config.defaultTitle,
        message: typeof message === 'string' ? message : getErrorMessage(message),
        confirmText: confirmText || config.btnText,
        cancelText: cancelText || config.cancelBtnText || 'Cancel',
        onConfirm: onConfirm || null,
        onCancel: onCancel || null,
        isDestructive,
      });
    },
    []
  );

  const showSuccess = useCallback((message, title = 'Success', onConfirm = null) => {
    showAlert({
      type: ALERT_TYPES.SUCCESS,
      title,
      message,
      onConfirm,
    });
  }, [showAlert]);

  const showError = useCallback((error, title = 'Something Went Wrong', onConfirm = null) => {
    showAlert({
      type: ALERT_TYPES.ERROR,
      title,
      message: getErrorMessage(error),
      onConfirm,
    });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Notice', onConfirm = null) => {
    showAlert({
      type: ALERT_TYPES.WARNING,
      title,
      message,
      onConfirm,
    });
  }, [showAlert]);

  const showConfirm = useCallback(
    ({
      title = 'Are you sure?',
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDestructive = false,
      onConfirm,
      onCancel,
    }) => {
      showAlert({
        type: ALERT_TYPES.CONFIRM,
        title,
        message,
        confirmText,
        cancelText,
        isDestructive,
        onConfirm,
        onCancel,
      });
    },
    [showAlert]
  );

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleConfirmPress = () => {
    const callback = alertState.onConfirm;
    hideAlert();
    if (callback) {
      setTimeout(() => callback(), 100);
    }
  };

  const handleCancelPress = () => {
    const callback = alertState.onCancel;
    hideAlert();
    if (callback) {
      setTimeout(() => callback(), 100);
    }
  };

  const currentConfig = ALERT_CONFIGS[alertState.type] || ALERT_CONFIGS[ALERT_TYPES.INFO];

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
        hideAlert,
      }}
    >
      {children}

      <Modal
        visible={alertState.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <TouchableWithoutFeedback onPress={hideAlert}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.alertBox}>
                {/* Icon Container */}
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: currentConfig.bgColor,
                      borderColor: currentConfig.color + '40',
                    },
                  ]}
                >
                  <Ionicons
                    name={currentConfig.icon}
                    size={40}
                    color={
                      alertState.isDestructive && alertState.type === ALERT_TYPES.CONFIRM
                        ? '#DC2626'
                        : currentConfig.color
                    }
                  />
                </View>

                {/* Title */}
                <Text style={styles.title}>{alertState.title}</Text>

                {/* Message */}
                <Text style={styles.message}>{alertState.message}</Text>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  {alertState.type === ALERT_TYPES.CONFIRM && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancelPress}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>{alertState.cancelText}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      {
                        backgroundColor: alertState.isDestructive
                          ? '#DC2626'
                          : currentConfig.color === '#059669'
                          ? '#059669'
                          : COLORS.primary,
                        flex: alertState.type === ALERT_TYPES.CONFIRM ? 1 : undefined,
                        width: alertState.type === ALERT_TYPES.CONFIRM ? undefined : '100%',
                      },
                    ]}
                    onPress={handleConfirmPress}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmBtnText}>{alertState.confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAppAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } : {}),
  },
  alertBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...SHADOWS.subtle,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
