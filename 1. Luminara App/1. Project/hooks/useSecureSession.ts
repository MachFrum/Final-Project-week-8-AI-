import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { securityManager } from '@/lib/security';
import { generateUUID, isValidUUID } from '@/utils/uuid';

export interface SecureSession {
  id: string;
  userId: string;
  startTime: string;
  isActive: boolean;
  securityLevel: 'standard' | 'enhanced';
  metadata: Record<string, any>;
}

export function useSecureSession() {
  const { user, isAuthenticated } = useAuth();
  const [session, setSession] = useState<SecureSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a new secure session
  const createSession = useCallback(async (): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create session with security context
      const sessionId = await securityManager.createSecureSession(user.id);
      
      if (!sessionId) {
        throw new Error('Failed to create secure session');
      }

      // Fetch the created session
      const { data: sessionData, error: fetchError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError || !sessionData) {
        throw new Error('Failed to fetch session data');
      }

      const secureSession: SecureSession = {
        id: sessionData.id,
        userId: sessionData.user_id,
        startTime: sessionData.session_start,
        isActive: !sessionData.session_end,
        securityLevel: sessionData.session_metadata?.security_level || 'standard',
        metadata: sessionData.session_metadata || {}
      };

      setSession(secureSession);
      
      // Log session creation
      await securityManager.logSecurityEvent(
        user.id,
        'session_created',
        'learning_session',
        sessionId,
        { securityLevel: secureSession.securityLevel }
      );

      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      console.error('Session creation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get current active session
  const getCurrentSession = useCallback(async (): Promise<SecureSession | null> => {
    if (!user?.id) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: sessionData, error: fetchError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No active session found
          return null;
        }
        throw fetchError;
      }

      if (!sessionData) {
        return null;
      }

      const secureSession: SecureSession = {
        id: sessionData.id,
        userId: sessionData.user_id,
        startTime: sessionData.session_start,
        isActive: !sessionData.session_end,
        securityLevel: sessionData.session_metadata?.security_level || 'standard',
        metadata: sessionData.session_metadata || {}
      };

      setSession(secureSession);
      return secureSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get session';
      setError(errorMessage);
      console.error('Get session error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // End current session
  const endSession = useCallback(async (sessionId?: string): Promise<boolean> => {
    const targetSessionId = sessionId || session?.id;
    
    if (!targetSessionId || !user?.id) {
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('learning_sessions')
        .update({
          session_end: new Date().toISOString(),
          session_metadata: {
            ...session?.metadata,
            ended_by: 'user',
            end_reason: 'manual'
          }
        })
        .eq('id', targetSessionId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Log session end
      await securityManager.logSecurityEvent(
        user.id,
        'session_ended',
        'learning_session',
        targetSessionId,
        { endReason: 'manual' }
      );

      setSession(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      console.error('End session error:', err);
      return false;
    }
  }, [session?.id, session?.metadata, user?.id]);

  // Update session activity
  const updateSessionActivity = useCallback(async (
    activity: {
      problemsSolved?: number;
      timeSpent?: number;
      subjectsCovered?: string[];
    }
  ): Promise<boolean> => {
    if (!session?.id || !user?.id) {
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('learning_sessions')
        .update({
          total_problems: activity.problemsSolved,
          total_time_minutes: activity.timeSpent,
          subjects_covered: activity.subjectsCovered,
          session_metadata: {
            ...session.metadata,
            last_activity: new Date().toISOString()
          }
        })
        .eq('id', session.id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      console.error('Update session activity error:', err);
      return false;
    }
  }, [session?.id, session?.metadata, user?.id]);

  // Validate session security
  const validateSessionSecurity = useCallback(async (): Promise<boolean> => {
    if (!session?.id || !user?.id) {
      return false;
    }

    try {
      // Check if session is still valid
      const { data: sessionData, error } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', session.id)
        .eq('user_id', user.id)
        .single();

      if (error || !sessionData) {
        setSession(null);
        return false;
      }

      // Check session timeout (1 hour default)
      const sessionStart = new Date(sessionData.session_start);
      const now = new Date();
      const hoursSinceStart = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

      if (hoursSinceStart > 1) {
        await endSession(session.id);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }, [session?.id, user?.id, endSession]);

  // Initialize session on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      getCurrentSession().then(existingSession => {
        if (!existingSession) {
          createSession();
        }
      });
    } else {
      setSession(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, getCurrentSession, createSession]);

  // Periodic session validation
  useEffect(() => {
    if (session?.id) {
      const interval = setInterval(() => {
        validateSessionSecurity();
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [session?.id, validateSessionSecurity]);

  return {
    session,
    isLoading,
    error,
    createSession,
    getCurrentSession,
    endSession,
    updateSessionActivity,
    validateSessionSecurity,
  };
}