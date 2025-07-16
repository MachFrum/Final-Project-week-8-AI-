import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronLeft, ChevronRight, Chrome as Home, BookOpen, ChartBar as BarChart3, User, Settings, TestTube, UserPlus, Mail, Lock, Eye } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import actual screens as components
import HomeScreen from '@/app/(tabs)/index';
import LearnScreen from '@/app/(tabs)/learn';
import ProgressScreen from '@/app/(tabs)/progress';
import ProfileScreen from '@/app/(tabs)/profile';
import LoginScreen from '@/app/auth/login';
import RegisterScreen from '@/app/auth/register';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import DebugScreen from '@/app/debug';
import TestSubmitScreen from '@/app/test-submit';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScreenInfo {
  id: string;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType;
  category: 'Main' | 'Auth' | 'Debug';
  color: string;
}

export default function DevMachScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const screens: ScreenInfo[] = [
    {
      id: 'home',
      title: 'Home',
      description: 'Main dashboard with stats, activities, and quick actions',
      icon: Home,
      component: HomeScreen,
      category: 'Main',
      color: colors.primary,
    },
    {
      id: 'learn',
      title: 'Learn',
      description: 'Problem submission with text, voice, and camera input',
      icon: BookOpen,
      component: LearnScreen,
      category: 'Main',
      color: colors.primaryDark,
    },
    {
      id: 'progress',
      title: 'Progress',
      description: 'Learning analytics, achievements, and progress tracking',
      icon: BarChart3,
      component: ProgressScreen,
      category: 'Main',
      color: colors.accent,
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'User settings, preferences, and account management',
      icon: User,
      component: ProfileScreen,
      category: 'Main',
      color: colors.warning,
    },
    {
      id: 'login',
      title: 'Login',
      description: 'User authentication with email and password',
      icon: Lock,
      component: LoginScreen,
      category: 'Auth',
      color: colors.success,
    },
    {
      id: 'register',
      title: 'Register',
      description: 'Account creation with form validation',
      icon: UserPlus,
      component: RegisterScreen,
      category: 'Auth',
      color: colors.error,
    },
    {
      id: 'forgot-password',
      title: 'Forgot Password',
      description: 'Password reset flow with email verification',
      icon: Mail,
      component: ForgotPasswordScreen,
      category: 'Auth',
      color: colors.primaryLight,
    },
    {
      id: 'debug',
      title: 'Debug Console',
      description: 'API testing, database connectivity, and system diagnostics',
      icon: TestTube,
      component: DebugScreen,
      category: 'Debug',
      color: colors.accentLight,
    },
    {
      id: 'test-submit',
      title: 'Test Submit',
      description: 'Test submit-problem Edge Function with UUID payload',
      icon: TestTube,
      component: TestSubmitScreen,
      category: 'Debug',
      color: colors.success,
    },
  ];

  const currentScreen = screens[currentIndex];

  const goToNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * screenWidth);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      translateX.value = withSpring(-(currentIndex - 1) * screenWidth);
    }
  };

  const goToScreen = (index: number) => {
    setCurrentIndex(index);
    translateX.value = withSpring(-index * screenWidth);
  };

  // Gesture handling for swipe navigation
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateX = -currentIndex * screenWidth + event.translationX;
      translateX.value = newTranslateX;
      
      // Add subtle scale effect during swipe
      const progress = Math.abs(event.translationX) / screenWidth;
      scale.value = 1 - progress * 0.05;
    })
    .onEnd((event) => {
      const threshold = screenWidth * 0.3;
      
      if (event.translationX > threshold && currentIndex > 0) {
        runOnJS(goToPrevious)();
      } else if (event.translationX < -threshold && currentIndex < screens.length - 1) {
        runOnJS(goToNext)();
      } else {
        translateX.value = withSpring(-currentIndex * screenWidth);
      }
      
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [-(screens.length - 1) * screenWidth, 0],
      [0, 1]
    );
    
    return {
      transform: [{ translateX: progress * (screenWidth - 60) }],
    };
  });

  useEffect(() => {
    translateX.value = withSpring(-currentIndex * screenWidth);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Main': return colors.primary;
      case 'Auth': return colors.warning;
      case 'Debug': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'light-content' : 'default'} />
      
      {/* Header */}
      <LinearGradient 
        colors={[colors.primary, colors.primaryDark]} 
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Dev Mach</Text>
            <Text style={styles.headerSubtitle}>
              {currentIndex + 1} of {screens.length} • {currentScreen.category}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={20} color={currentIndex === 0 ? '#FFFFFF50' : '#FFFFFF'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, currentIndex === screens.length - 1 && styles.navButtonDisabled]}
              onPress={goToNext}
              disabled={currentIndex === screens.length - 1}
            >
              <ChevronRight size={20} color={currentIndex === screens.length - 1 ? '#FFFFFF50' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Screen Info */}
        <View style={[styles.screenInfo, { backgroundColor: colors.overlayLight }]}>
          <View style={[styles.screenIcon, { backgroundColor: currentScreen.color + '30' }]}>
            <currentScreen.icon size={24} color={currentScreen.color} />
          </View>
          <View style={styles.screenDetails}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>{currentScreen.title}</Text>
            <Text style={[styles.screenDescription, { color: colors.textSecondary }]}>
              {currentScreen.description}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(currentScreen.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(currentScreen.category) }]}>
              {currentScreen.category}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Screen Container with ScrollView */}
      <View style={styles.screenContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.screensWrapper, animatedStyle]}>
            {screens.map((screen, index) => {
              const ScreenComponent = screen.component;
              return (
                <View key={screen.id} style={styles.screenSlide}>
                  <ScrollView 
                    style={styles.screenScrollView}
                    contentContainerStyle={[
                      styles.screenScrollContent,
                      { paddingBottom: insets.bottom + 120 } // Account for bottom nav
                    ]}
                    showsVerticalScrollIndicator={true}
                    scrollIndicatorInsets={{ right: 2 }}
                    bounces={true}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.screenContent}>
                      <ScreenComponent />
                    </View>
                  </ScrollView>
                </View>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Bottom Navigation */}
      <View style={[
        styles.bottomNav, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 10
        }
      ]}>
        {/* Progress Indicator */}
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[
              styles.progressIndicator, 
              { backgroundColor: colors.primary },
              indicatorStyle
            ]} 
          />
        </View>
        
        {/* Screen Thumbnails */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsContainer}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={80}
          snapToAlignment="start"
        >
          {screens.map((screen, index) => (
            <TouchableOpacity
              key={screen.id}
              style={[
                styles.thumbnail,
                { backgroundColor: colors.surfaceSecondary },
                index === currentIndex && { 
                  backgroundColor: colors.primary + '20', 
                  borderColor: colors.primary,
                  borderWidth: 1
                }
              ]}
              onPress={() => goToScreen(index)}
              activeOpacity={0.7}
            >
              <screen.icon 
                size={16} 
                color={index === currentIndex ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.thumbnailText,
                { color: index === currentIndex ? colors.primary : colors.textSecondary }
              ]}>
                {screen.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  screenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  screenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  screenDetails: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  screenDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  screensWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  screenSlide: {
    width: screenWidth,
    height: '100%',
  },
  screenScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  screenContent: {
    flex: 1,
    backgroundColor: 'transparent',
    minHeight: screenHeight * 0.6, // Ensure minimum height for scrolling
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressIndicator: {
    width: 60,
    height: '100%',
    borderRadius: 2,
  },
  thumbnailsContainer: {
    gap: 12,
    paddingHorizontal: 4,
  },
  thumbnail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
});