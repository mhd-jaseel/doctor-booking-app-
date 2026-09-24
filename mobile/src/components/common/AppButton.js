import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

/**
 * AppButton:
 * Global professional button with instant double-click prevention,
 * strict loading lock, and zero-layout-shift ActivityIndicator.
 */
export const AppButton = ({
  title,
  loadingTitle,
  loading = false,
  disabled = false,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  style,
  textStyle,
  ...props
}) => {
  const isActionDisabled = disabled || loading;

  const handlePress = () => {
    if (isActionDisabled || !onPress) return;
    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          spinnerColor: COLORS.primary,
        };
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
          spinnerColor: COLORS.primary,
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
          spinnerColor: COLORS.white,
        };
      case 'success':
        return {
          container: styles.successContainer,
          text: styles.successText,
          spinnerColor: COLORS.white,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          spinnerColor: COLORS.white,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: 36, paddingHorizontal: 12, fontSize: 12, iconSize: 14 };
      case 'lg':
        return { height: 50, paddingHorizontal: 20, fontSize: 16, iconSize: 20 };
      case 'md':
      default:
        return { height: 44, paddingHorizontal: 16, fontSize: 14, iconSize: 16 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const displayTitle = loading
    ? loadingTitle || (title ? `${title.replace(/e$/, '')}ing...` : 'Processing...')
    : title;

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        vStyles.container,
        { height: sStyles.height, paddingHorizontal: sStyles.paddingHorizontal },
        isActionDisabled && styles.disabledContainer,
        style,
      ]}
      onPress={handlePress}
      disabled={isActionDisabled}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.innerRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={vStyles.spinnerColor}
            style={styles.spinner}
          />
        ) : (
          icon && <View style={styles.iconWrapper}>{icon}</View>
        )}

        <Text
          style={[
            styles.baseText,
            vStyles.text,
            { fontSize: sStyles.fontSize },
            isActionDisabled && !loading && styles.disabledText,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  spinner: {
    marginRight: 8,
  },
  iconWrapper: {
    marginRight: 6,
  },
  // Variant Containers
  primaryContainer: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.subtle,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryContainer: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryText: {
    color: COLORS.textSecondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  dangerContainer: {
    backgroundColor: '#DC2626',
    ...SHADOWS.subtle,
  },
  dangerText: {
    color: COLORS.white,
  },
  successContainer: {
    backgroundColor: '#059669',
    ...SHADOWS.subtle,
  },
  successText: {
    color: COLORS.white,
  },
  // Disabled state
  disabledContainer: {
    opacity: 0.65,
  },
  disabledText: {
    opacity: 0.85,
  },
});
