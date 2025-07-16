import { Platform } from 'react-native';

// Platform-specific imports with fallbacks
let CameraView: any = null;
let CameraType: any = null;
let FlashMode: any = null;
let useCameraPermissions: any = null;
let Haptics: any = null;

try {
  if (Platform.OS !== 'web') {
    const cameraModule = require('expo-camera');
    CameraView = cameraModule.CameraView;
    CameraType = cameraModule.CameraType;
    FlashMode = cameraModule.FlashMode;
    useCameraPermissions = cameraModule.useCameraPermissions;
    
    const hapticsModule = require('expo-haptics');
    Haptics = hapticsModule;
  }
} catch (error) {
  console.warn('Camera or Haptics modules not available:', error);
}

// Mock implementations for web or when modules are not available
const mockCameraView = ({ children, ...props }: any) => {
  const React = require('react');
  const { View, Text, StyleSheet } = require('react-native');
  
  // Remove collapsable from props to prevent web DOM errors
  const { collapsable, ...cleanProps } = props;
  
  const viewProps = {
    ...cleanProps,
    style: [
      {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      },
      props.style
    ]
  };
  
  return React.createElement(View, viewProps, [
    React.createElement(Text, {
      key: 'mock-text',
      style: { color: '#FFF', fontSize: 16 }
    }, 'Camera not available on web'),
    children
  ]);
};

const mockCameraType = {
  back: 'back',
  front: 'front'
};

const mockFlashMode = {
  off: 'off',
  on: 'on',
  auto: 'auto'
};

const mockUseCameraPermissions = () => {
  const { useState } = require('react');
  const [permission] = useState({
    granted: false,
    canAskAgain: true,
    status: 'undetermined'
  });
  
  const requestPermission = async () => {
    return { granted: false };
  };
  
  return [permission, requestPermission];
};

const mockHaptics = {
  impactAsync: () => Promise.resolve(),
  notificationAsync: () => Promise.resolve(),
  selectionAsync: () => Promise.resolve()
};

// Export the appropriate implementations
export const CameraViewComponent = CameraView || mockCameraView;
export const CameraTypeEnum = CameraType || mockCameraType;
export const FlashModeEnum = FlashMode || mockFlashMode;
export const useCameraPermissionsHook = useCameraPermissions || mockUseCameraPermissions;
export const HapticsModule = Haptics || mockHaptics;

// Helper function to check if camera is available
export const isCameraAvailable = () => {
  return Platform.OS !== 'web' && CameraView !== null;
};