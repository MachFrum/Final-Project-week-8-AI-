import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Achievement } from '@/types/progress';
import { Star, Trophy, Target, Flame } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AchievementBadgeProps {
  achievement: Achievement;
  index: number;
  onPress?: () => void;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'star': return Star;
    case 'trophy': return Trophy;
    case 'target': return Target;
    case 'flame': return Flame;
    default: return Star;
  }
};

const getRarityStyle = (rarity: Achievement['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return { borderColor: '#FFD700', shadowColor: '#FFD700' };
    case 'epic':
      return { borderColor: '#9B59B6', shadowColor: '#9B59B6' };
    case 'rare':
      return { borderColor: '#3498DB', shadowColor: '#3498DB' };
    default:
      return { borderColor: '#95A5A6', shadowColor: '#95A5A6' };
  }
};

export default function AchievementBadge({ achievement, index, onPress }: AchievementBadgeProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const IconComponent = getIcon(achievement.icon);
  const rarityStyle = getRarityStyle(achievement.rarity);

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
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow animation for legendary items
    if (achievement.rarity === 'legendary') {
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
    }
  }, [index, achievement.rarity]);

  const scale = scaleAnim;
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.surface, shadowColor: colors.shadow },
          rarityStyle,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {achievement.rarity === 'legendary' && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
                shadowColor: rarityStyle.shadowColor,
              },
            ]}
          />
        )}
        
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: achievement.color + '20' },
            { transform: [{ rotate }] },
          ]}
        >
          <IconComponent size={24} color={achievement.color} />
        </Animated.View>
        
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {achievement.title}
        </Text>
        
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {achievement.description}
        </Text>
        
        {achievement.progress !== undefined && achievement.maxProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    backgroundColor: achievement.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'center',
  },
});