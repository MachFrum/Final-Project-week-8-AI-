import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { DailyActivity } from '@/types/progress';
import { useTheme } from '@/contexts/ThemeContext';

interface ActivityChartProps {
  data: DailyActivity[];
  height?: number;
}

export default function ActivityChart({ data, height = 120 }: ActivityChartProps) {
  const { colors } = useTheme();
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  const maxProblems = Math.max(...data.map(day => day.problems), 1);

  useEffect(() => {
    const animations = animatedValues.map((animValue, index) => 
      Animated.timing(animValue, {
        toValue: data[index].problems,
        duration: 800,
        delay: index * 100,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, [data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.chart, { height }]}>
        {data.map((day, index) => {
          const barHeight = animatedValues[index].interpolate({
            inputRange: [0, maxProblems],
            outputRange: [4, height - 40],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity key={day.date} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: day.completed ? colors.primary : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </Text>
              <Text style={[styles.problemCount, { color: colors.text }]}>{day.problems}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 16,
    borderRadius: 8,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  problemCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});