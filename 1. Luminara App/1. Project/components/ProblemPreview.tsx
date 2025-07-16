import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Tag, ChevronDown, ChevronUp, Mic, Camera, Type } from 'lucide-react-native';
import { ProblemEntry } from '@/types/learning';
import { useTheme } from '@/contexts/ThemeContext';

interface ProblemPreviewProps {
  problem: ProblemEntry;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

export default function ProblemPreview({ problem, onPress }: ProblemPreviewProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setExpanded(!expanded);
  };

  const expandedHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getTypeIcon = () => {
    switch (problem.type) {
      case 'voice': return Mic;
      case 'image': return Camera;
      default: return Type;
    }
  };

  const getDifficultyColor = () => {
    switch (problem.difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceSecondary]}
        style={styles.gradient}
      >
        {/* Preview Header */}
        <View style={styles.previewHeader}>
          <View style={styles.leftContent}>
            {problem.imageUrl && (
              <Image source={{ uri: problem.imageUrl }} style={[styles.thumbnail, { backgroundColor: colors.border }]} />
            )}
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {problem.title}
              </Text>
              <Text style={[styles.topic, { color: colors.primary }]} numberOfLines={1}>
                {problem.topic}
              </Text>
              <View style={styles.metadata}>
                <View style={styles.typeIndicator}>
                  <TypeIcon size={12} color={colors.primary} />
                  <Text style={[styles.typeText, { color: colors.primary }]}>{problem.type}</Text>
                </View>
                <View style={styles.timeIndicator}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{problem.timeSpent}m</Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
                    {problem.difficulty}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <ChevronDown size={20} color={colors.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Expanded Content */}
        <Animated.View style={[styles.expandedContent, { height: expandedHeight }]}>
          <View style={[styles.expandedInner, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Problem Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{problem.description}</Text>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Solution</Text>
            <Text style={[styles.solution, { color: colors.textSecondary }]}>{problem.solution}</Text>
            
            {problem.tags.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {problem.tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Tag size={10} color={colors.primary} />
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topic: {
    fontSize: 14,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  expandButton: {
    padding: 8,
  },
  expandedContent: {
    overflow: 'hidden',
  },
  expandedInner: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  solution: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
  },
});