import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Camera as CameraIcon, 
  RotateCcw, 
  Image as ImageIcon, 
  X,
  Zap
} from 'lucide-react-native';
import { 
  CameraViewComponent, 
  CameraTypeEnum, 
  FlashModeEnum, 
  useCameraPermissionsHook, 
  HapticsModule,
  isCameraAvailable 
} from '@/utils/camera';

const { width, height } = Dimensions.get('window');

interface CameraCaptureProps {
  onCapture: (result: any) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [facing, setFacing] = useState<string>(CameraTypeEnum?.back || 'back');
  const [permission, requestPermission] = useCameraPermissionsHook();
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<string>(FlashModeEnum?.off || 'off');
  const cameraRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={['#8A2BE2', '#6A1B9A']}
          style={styles.permissionGradient}
        >
          <CameraIcon size={64} color="#FFF" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            To help you learn, we need access to your camera to capture problems and concepts.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    
    if (Platform.OS !== 'web' && HapticsModule?.selectionAsync) {
      try {
        HapticsModule.selectionAsync();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        
        // Animate capture button
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        
        if (Platform.OS !== 'web' && HapticsModule?.impactAsync) {
          try {
            HapticsModule.impactAsync();
          } catch (error) {
            console.warn('Haptics not available:', error);
          }
        }
        
        if (Platform.OS === 'web' || !isCameraAvailable()) {
          // For web platform, simulate capture
          setTimeout(() => {
            setIsCapturing(false);
            onCapture({ uri: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg' });
          }, 1000);
        } else {
          // For native platforms
          if (cameraRef.current?.takePictureAsync) {
            const photo = await cameraRef.current.takePictureAsync();
            onCapture(photo);
          }
          setIsCapturing(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        setIsCapturing(false);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const openGallery = () => {
    Alert.alert(
      'Select Image',
      'Choose an image from your gallery to start learning.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Gallery', 
          onPress: () => onCapture({ uri: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg' })
        }
      ]
    );
  };

  const cameraProps: any = {
    style: styles.camera,
    facing,
    ref: cameraRef
  };

  if (isCameraAvailable()) {
    if (FlashModeEnum && flashMode) {
      cameraProps.flash = flashMode;
    }
  }

  return (
    <View style={styles.container}>
      <CameraViewComponent {...cameraProps}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
          style={styles.topOverlay}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonInner}>
              <X size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.instructionText}>
            Point your camera at any problem or concept
          </Text>
        </LinearGradient>

        {/* Focus Frame */}
        <View style={styles.centerOverlay}>
          <View style={styles.focusFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Controls */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={openGallery}
            >
              <View style={styles.controlButtonInner}>
                <ImageIcon size={24} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
                onPress={takePicture}
                disabled={isCapturing}
              >
                <LinearGradient
                  colors={isCapturing ? ['#EF4444', '#DC2626'] : ['#8A2BE2', '#6A1B9A']}
                  style={styles.captureButtonInner}
                >
                  {isCapturing ? (
                    <Zap size={32} color="#FFF" />
                  ) : (
                    <CameraIcon size={32} color="#FFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <View style={styles.controlButtonInner}>
                <RotateCcw size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </CameraViewComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#8A2BE2',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 60,
  },
  centerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
  },
  focusFrame: {
    width: 300,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#8A2BE2',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
  },
  controlButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonActive: {
    borderColor: '#EF4444',
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});