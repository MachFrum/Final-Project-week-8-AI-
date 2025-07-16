import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface GuestBannerProps {
  onDismiss?: () => void;
}

export default function GuestBanner({ onDismiss }: GuestBannerProps) {
  const { colors } = useTheme();
  
  const handleCreateAccount = () => {
    router.push('/auth/register');
  };

  return (
    <View style={[styles.container, { shadowColor: colors.shadow }]}>
      <LinearGradient
        colors={[colors.warning + '30', colors.warning + '20']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
            <UserPlus size={20} color={colors.warning} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.warning }]}>You're browsing as a guest</Text>
            <Text style={[styles.subtitle, { color: colors.warning }]}>
              Create an account to save your progress and access all features
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            onPress={handleCreateAccount}
          >
            <Text style={[styles.actionButtonText, { color: colors.surface }]}>Sign Up</Text>
          </TouchableOpacity>
          
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <X size={16} color={colors.warning} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});