import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Clock, 
  Star, 
  Flame, 
  Trophy, 
  ChevronRight,
  Zap,
  Brain,
  Users,
  Award
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import GuestBanner from '@/components/GuestBanner';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
}

interface RecentActivity {
  id: string;
  title: string;
  subject: string;
  timeAgo: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  progress: number;
  maxProgress: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Start Learning',
      description: 'Ask a question or solve a problem',
      icon: Brain,
      color: colors.primary,
      route: '/learn',
    },
    {
      id: '2',
      title: 'View Progress',
      description: 'Track your learning journey',
      icon: TrendingUp,
      color: colors.primaryDark,
      route: '/progress',
    },
    {
      id: '3',
      title: 'Study Groups',
      description: 'Join collaborative sessions',
      icon: Users,
      color: colors.accent,
      route: '/groups',
    },
    {
      id: '4',
      title: 'Achievements',
      description: 'View your accomplishments',
      icon: Award,
      color: colors.warning,
      route: '/achievements',
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      title: 'Quadratic Equations',
      subject: 'Mathematics',
      timeAgo: '2 hours ago',
      difficulty: 'medium',
      imageUrl: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    },
    {
      id: '2',
      title: 'Photosynthesis Process',
      subject: 'Biology',
      timeAgo: '1 day ago',
      difficulty: 'easy',
      imageUrl: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    },
    {
      id: '3',
      title: 'Newton\'s Laws',
      subject: 'Physics',
      timeAgo: '2 days ago',
      difficulty: 'hard',
      imageUrl: 'https://images.pexels.com/photos/8500/apple-desk-laptop-working.jpg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Problem Solver',
      description: 'Solve 50 problems',
      icon: Target,
      color: colors.primary,
      progress: 35,
      maxProgress: 50,
    },
    {
      id: '2',
      title: 'Streak Master',
      description: '7 day learning streak',
      icon: Flame,
      color: colors.error,
      progress: 7,
      maxProgress: 7,
    },
    {
      id: '3',
      title: 'Quick Learner',
      description: 'Complete 5 topics',
      icon: Zap,
      color: colors.warning,
      progress: 3,
      maxProgress: 5,
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.welcomeSection}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}, {user?.firstName || 'Learner'}! 👋
            </Text>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Ready to learn something new?
            </Text>
          </View>

          {/* Stats Overview */}
          <View style={[styles.statsContainer, { backgroundColor: colors.overlayLight }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '30' }]}>
                <BookOpen size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>127</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Problems</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryDark + '30' }]}>
                <Clock size={20} color={colors.primaryDark} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>42</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hours</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.error + '30' }]}>
                <Flame size={20} color={colors.error} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>7</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Guest Banner */}
        {user?.isGuest && <GuestBanner />}

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[action.color + '20', action.color + '10']}
                  style={styles.quickActionGradient}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color + '30' }]}>
                    <action.icon size={24} color={action.color} />
                  </View>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>{action.title}</Text>
                  <Text style={[styles.quickActionDescription, { color: colors.textSecondary }]}>
                    {action.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
              activeOpacity={0.8}
            >
              <Image source={{ uri: activity.imageUrl }} style={styles.activityImage} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                <Text style={[styles.activitySubject, { color: colors.primary }]}>{activity.subject}</Text>
                <View style={styles.activityMeta}>
                  <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.timeAgo}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(activity.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(activity.difficulty) }]}>
                      {activity.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Achievements Progress */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[styles.achievementCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            >
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                <achievement.icon size={24} color={achievement.color} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                  {achievement.description}
                </Text>
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
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Motivational Quote */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.quoteCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <LinearGradient
              colors={[colors.accent + '20', colors.accent + '10']}
              style={styles.quoteGradient}
            >
              <Star size={32} color={colors.accent} />
              <Text style={[styles.quoteText, { color: colors.text }]}>
                "The beautiful thing about learning is that no one can take it away from you."
              </Text>
              <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>— B.B. King</Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubject: {
    fontSize: 14,
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTime: {
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
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  quoteCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteGradient: {
    padding: 24,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginVertical: 16,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
});