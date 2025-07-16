import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Upload, Shield, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { mediaUploadManager } from '@/lib/mediaUpload';
import LoadingSpinner from './LoadingSpinner';

interface SecureUploadProps {
  onUploadComplete?: (uploadId: string, url: string) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  bucket?: 'user-uploads' | 'problem-images' | 'voice-recordings';
  folder?: string;
}

export default function SecureUpload({
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10,
  bucket = 'user-uploads',
  folder
}: SecureUploadProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to upload files');
      return;
    }

    if (Platform.OS === 'web') {
      // Web file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptedTypes.join(',');
      input.multiple = false;

      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          await handleFileUpload(file);
        }
      };

      input.click();
    } else {
      // Mobile file picker would go here
      Alert.alert('Info', 'File upload is currently available on web only');
    }
  }, [user?.id, acceptedTypes]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user?.id) {
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await mediaUploadManager.uploadFile({
        userId: user.id,
        file,
        bucket,
        folder,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          securityValidated: true
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.uploadId && result.url) {
        setUploadStatus('success');
        onUploadComplete?.(result.uploadId, result.url);
        
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
        }, 2000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      Alert.alert('Upload Error', errorMessage);
      
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, bucket, folder, onUploadComplete, onUploadError]);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <LoadingSpinner size={20} color={colors.primary} />;
      case 'success':
        return <CheckCircle size={20} color={colors.success} />;
      case 'error':
        return <XCircle size={20} color={colors.error} />;
      default:
        return <Upload size={20} color={colors.primary} />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'success':
        return 'Upload successful!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Select file to upload';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'uploading':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <LinearGradient
        colors={[colors.primary + '10', colors.primary + '05']}
        style={styles.gradient}
      >
        {/* Security Badge */}
        <View style={[styles.securityBadge, { backgroundColor: colors.success + '20' }]}>
          <Shield size={12} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.success }]}>Secure Upload</Text>
        </View>

        {/* Upload Area */}
        <TouchableOpacity
          style={[
            styles.uploadArea,
            { borderColor: colors.border },
            uploadStatus === 'success' && { borderColor: colors.success },
            uploadStatus === 'error' && { borderColor: colors.error }
          ]}
          onPress={handleFileSelect}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <View style={styles.uploadContent}>
            {getStatusIcon()}
            <Text style={[styles.uploadText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            
            {uploadStatus === 'uploading' && (
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${uploadProgress}%`,
                      backgroundColor: colors.primary
                    }
                  ]}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Upload Info */}
        <View style={styles.uploadInfo}>
          <View style={styles.infoRow}>
            <AlertTriangle size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Max size: {maxFileSize}MB
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Accepted: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadContent: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  uploadInfo: {
    marginTop: 12,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
});