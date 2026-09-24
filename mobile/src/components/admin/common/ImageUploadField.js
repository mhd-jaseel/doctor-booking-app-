import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppImage } from '../../common/AppImage';
import { COLORS, RADIUS } from '../../../constants/theme';
import { fileService } from '../../../services';
import { useAppAlert } from '../../common/AppAlert';

/**
 * Reusable Admin Image Uploader Component
 * Allows choosing, previewing, uploading to MongoDB GridFS, and removing images.
 */
export const ImageUploadField = ({
  label = 'Image',
  imageUrl,
  imageFileId,
  fallbackType = 'doctor',
  gender = 'male',
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError, showWarning, showConfirm } = useAppAlert();

  const handlePickImage = async () => {
    if (uploading) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showWarning('Permission to access image gallery is required.', 'Permission Denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // 1. Client-side File Size Validation (Max 5MB = 5 * 1024 * 1024 bytes)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showError('Image size must be 5 MB or less.', 'File Too Large');
          return;
        }

        // 2. Client-side File Type Validation
        const filename = asset.fileName || asset.uri?.split('/').pop() || `upload_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

        if (!allowedExtensions.includes(ext)) {
          showError('Only JPG, PNG and WEBP images are allowed.', 'Unsupported Format');
          return;
        }

        await uploadToGridFS(asset, filename, ext);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      showError('Unable to select image. Please try again.', 'Image Selection Failed');
    }
  };

  const uploadToGridFS = async (asset, filename, ext) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } else {
        formData.append('image', {
          uri: asset.uri,
          name: filename,
          type: mimeType,
        });
      }

      const uploadRes = await fileService.uploadImage(formData);
      const data = uploadRes?.data || uploadRes;

      if (data && (data.imageUrl || data.fileId)) {
        onChange({
          image: data.imageUrl,
          imageFileId: data.fileId,
        });
        showSuccess('Image uploaded and stored securely in MongoDB GridFS.', 'Image Uploaded');
      } else {
        throw new Error('Upload response did not contain file reference.');
      }
    } catch (error) {
      console.error('GridFS Upload Error:', error);
      showError('Unable to upload the doctor image. Please try again.', 'Image Upload Failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    showConfirm({
      title: 'Remove Image?',
      message: 'Are you sure you want to remove this image from the profile?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        if (imageFileId) {
          try {
            await fileService.deleteFile(imageFileId);
          } catch (e) {
            console.log('Error cleaning GridFS file:', e.message);
          }
        }
        onChange({
          image: '',
          imageFileId: null,
        });
        showSuccess('Image removed successfully.', 'Image Removed');
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.contentRow}>
        {/* Image Preview / Gender Placeholder */}
        <View style={styles.previewBox}>
          <AppImage
            source={imageUrl}
            fallbackType={fallbackType}
            gender={gender}
            style={styles.previewImg}
            imageStyle={{ borderRadius: RADIUS.md }}
            iconSize={36}
          />
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.pickBtn, uploading && styles.disabledBtn]}
            onPress={handlePickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} />
            <Text style={styles.pickBtnText}>
              {uploading ? 'Uploading...' : imageUrl ? 'Replace Image' : 'Choose Image'}
            </Text>
          </TouchableOpacity>

          {imageUrl ? (
            <TouchableOpacity
              style={[styles.removeBtn, uploading && styles.disabledBtn]}
              onPress={handleRemoveImage}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={14} color="#DC2626" />
              <Text style={styles.removeBtnText}>Remove Image</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.helperText}>Stored in MongoDB GridFS (Max 5MB)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewBox: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGroup: {
    flex: 1,
    gap: 6,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    gap: 6,
    alignSelf: 'flex-start',
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    gap: 4,
    alignSelf: 'flex-start',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
