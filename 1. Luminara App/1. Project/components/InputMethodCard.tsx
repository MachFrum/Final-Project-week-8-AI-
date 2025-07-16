import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Type, Mic, Camera } from 'lucide-react-native';
import { InputMethod } from '@/types/learning';
import { useTheme } from '@/contexts/ThemeContext';

interface InputMethodCardProps {
  method: InputMethod;
  onPress: () => void;
  index: number;
}

export default function InputMethodCard({ method, onPress, index }: InputMethodCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 150;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  const getIcon = () => {
    switch (method.type) {
      case 'text': return Type;
      case 'voice': return Mic;
      case 'camera': return Camera;
      default: return Type;
    }
  };

  const IconComponent = getIcon();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[method.color, method.color + '80']}
          style={styles.gradient}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.overlayLight }]}>
            <IconComponent size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: colors.surface }]}>{method.title}</Text>
          <Text style={[styles.description, { color: colors.surface }]}>{method.description}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
});