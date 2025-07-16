import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PulsingActionButtonProps {
  onPress: () => void;
  size?: number;
}

export default function PulsingActionButton({ onPress, size = 80 }: PulsingActionButtonProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            opacity: glowOpacity,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      />
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pulseAnim }],
              shadowColor: colors.primary,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[
              styles.gradient,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <Plus size={size * 0.4} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  button: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});