import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProgress {
  problemsSolved: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  subjectsStudied: string[];
  lastActivityDate: string | null;
}

export function useUserProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user?.id || user.isGuest) {
      // For guest users, return mock data
      setProgress({
        problemsSolved: 0,
        totalStudyTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        level: 1,
        subjectsStudied: [],
        lastActivityDate: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No progress record exists, create one
          const { data: newProgress, error: insertError } = await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              problems_solved: 0,
              total_study_time_minutes: 0,
              current_streak: 0,
              longest_streak: 0,
              total_points: 0,
              level: 1,
              subjects_studied: [],
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          if (newProgress) {
            setProgress({
              problemsSolved: newProgress.problems_solved,
              totalStudyTimeMinutes: newProgress.total_study_time_minutes,
              currentStreak: newProgress.current_streak,
              longestStreak: newProgress.longest_streak,
              totalPoints: newProgress.total_points,
              level: newProgress.level,
              subjectsStudied: newProgress.subjects_studied,
              lastActivityDate: newProgress.last_activity_date,
            });
          }
        } else {
          throw fetchError;
        }
      } else if (data) {
        setProgress({
          problemsSolved: data.problems_solved,
          totalStudyTimeMinutes: data.total_study_time_minutes,
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          totalPoints: data.total_points,
          level: data.level,
          subjectsStudied: data.subjects_studied,
          lastActivityDate: data.last_activity_date,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      console.error('Error fetching user progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.isGuest]);

  const updateProgress = useCallback(async (updates: Partial<UserProgress>) => {
    if (!user?.id || user.isGuest) {
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          problems_solved: updates.problemsSolved,
          total_study_time_minutes: updates.totalStudyTimeMinutes,
          current_streak: updates.currentStreak,
          longest_streak: updates.longestStreak,
          total_points: updates.totalPoints,
          level: updates.level,
          subjects_studied: updates.subjectsStudied,
          last_activity_date: updates.lastActivityDate,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProgress(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating user progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  }, [user?.id, user?.isGuest]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    fetchProgress,
    updateProgress,
  };
}