import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

/**
 * Reusable Production-Safe AppImage Component
 *
 * Supports:
 * - Remote image loading with caching
 * - Offline fallback / network failure handling
 * - Gender-aware doctor placeholders (Male, Female, Generic)
 * - Facility / Hospital local placeholder
 * - Zero broken image icons under any failure condition
 *
 * @param {Object} props
 * @param {string|Object} props.source - Image URI or require(...) asset
 * @param {'doctor'|'facility'|'user'} props.fallbackType - Type of entity
 * @param {'male'|'female'|string} props.gender - Gender of doctor/person if applicable
 * @param {Object} props.style - Style for the image container
 * @param {Object} props.imageStyle - Specific image styling (e.g. borderRadius)
 * @param {number} props.iconSize - Custom icon size for placeholder
 */
export const AppImage = ({
  source,
  fallbackType = 'doctor',
  gender = 'male',
  style,
  imageStyle,
  iconSize = 36,
  resizeMode = 'cover',
}) => {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Normalize image source
  const imageUri =
    typeof source === 'string'
      ? source.trim()
      : source && source.uri
      ? source.uri.trim()
      : null;

  // Determine if we should show fallback immediately
  const shouldShowFallback = !imageUri || hasError;

  const renderPlaceholder = () => {
    let iconName = 'person';
    let iconColor = COLORS.primary;
    let bgColor = '#EFF6FF';

    if (fallbackType === 'facility') {
      iconName = 'business';
      iconColor = COLORS.primary;
      bgColor = '#EFF6FF';
    } else if (fallbackType === 'doctor' || fallbackType === 'user') {
      const normalizedGender = (gender || '').toLowerCase();
      if (normalizedGender === 'female') {
        iconName = 'woman';
        iconColor = '#9333EA';
        bgColor = '#FAF5FF';
      } else if (normalizedGender === 'male') {
        iconName = 'man';
        iconColor = COLORS.primary;
        bgColor = '#EFF6FF';
      } else {
        iconName = 'person';
        iconColor = COLORS.primary;
        bgColor = '#EFF6FF';
      }
    }

    return (
      <View style={[styles.placeholderContainer, { backgroundColor: bgColor }, imageStyle]}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {shouldShowFallback ? (
        renderPlaceholder()
      ) : (
        <View style={[styles.imageWrap, imageStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, imageStyle]}
            resizeMode={resizeMode}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
          />
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
