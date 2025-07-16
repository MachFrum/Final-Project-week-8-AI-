import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  style, 
  suffix = '', 
  prefix = '' 
}: AnimatedCounterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: animValue }) => {
      displayValue.current = Math.floor(animValue);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  return (
    <Animated.Text style={[styles.counter, style]}>
      {prefix}
      <Animated.Text>
        {animatedValue.interpolate({
          inputRange: [0, value],
          outputRange: ['0', value.toString()],
          extrapolate: 'clamp',
        })}
      </Animated.Text>
      {suffix}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontWeight: '700',
  },
});