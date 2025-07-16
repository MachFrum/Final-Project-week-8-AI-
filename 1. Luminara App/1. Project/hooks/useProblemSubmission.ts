import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProblemSubmissionData {
  title: string;
  inputType: 'text' | 'image' | 'voice';
  textContent?: string;
  imageData?: string; // base64 encoded image
  voiceUrl?: string;
  description?: string;
}

export interface ProblemResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  solution?: string;
  explanation?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  errorMessage?: string;
}

// Generate a valid UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function useProblemSubmission() {
  const { user, isAuthenticated, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ProblemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitProblem = useCallback(async (data: ProblemSubmissionData): Promise<string | null> => {
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    // Validate input
    if (!data.title.trim()) {
      setError('Problem title is required');
      setIsSubmitting(false);
      return null;
    }

    if (!data.textContent?.trim() && !data.imageData && !data.voiceUrl) {
      setError('Problem content is required');
      setIsSubmitting(false);
      return null;
    }

    try {
      // Prepare request body
      const requestBody = {
        input_type: data.inputType,
        title: data.title.trim(),
        description: data.description?.trim(),
        text_content: data.textContent?.trim(),
        image_data: data.imageData,
        voice_url: data.voiceUrl,
      };

      // Prepare headers - try multiple auth methods
      const headers: Record<string, string> = {};
      
      // First, try to get a real Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // We have a real Supabase session
        headers.Authorization = `Bearer ${session.access_token}`;
        console.log('Using Supabase auth token');
      } else if (token) {
        // Fall back to mock auth token if available
        headers.Authorization = `Bearer ${token}`;
        console.log('Using mock auth token');
      } else {
        // No auth available - the edge function will use default user
        console.log('No auth token available - submitting as guest');
      }

      console.log('Submitting problem with data:', {
        ...requestBody,
        image_data: requestBody.image_data ? '[IMAGE_DATA]' : undefined,
      });

      // Invoke the edge function
      const invokeOptions: any = { body: requestBody };
      
      // Only add headers if we have auth
      if (Object.keys(headers).length > 0) {
        invokeOptions.headers = headers;
      }
      
      const { data: response, error: submitError } = await supabase.functions.invoke(
        'secure-submit-problem',
        invokeOptions
      );

      console.log('Edge Function response:', response);
      console.log('Edge Function error:', submitError);

      if (submitError) {
        console.error('Edge Function submission error:', submitError);
        
        let errorMessage = 'Failed to submit problem to AI service';
        
        if (submitError.name === 'FunctionsHttpError') {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.';
        } else if (submitError.message) {
          errorMessage = submitError.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!response) {
        throw new Error('No response received from AI service');
      }

      if (!response.success) {
        const errorMsg = response.error || 'AI processing failed';
        throw new Error(errorMsg);
      }

      if (!response.problemId || !isValidUUID(response.problemId)) {
        throw new Error('Invalid response from AI service');
      }

      console.log('Problem submitted successfully with ID:', response.problemId);

      // Set result
      const initialResult: ProblemResult = {
        id: response.problemId,
        status: response.status || 'completed',
        solution: response.solution,
        subject: response.subject,
        difficulty: response.difficulty,
        tags: response.tags,
      };

      setResult(initialResult);

      // If still processing, start polling
      if (response.status === 'processing' || response.status === 'pending') {
        console.log('Starting polling for problem completion');
        pollForCompletion(response.problemId);
      }

      return response.problemId;

    } catch (err) {
      console.error('Problem submission error:', err);
      
      let errorMessage = 'Failed to submit problem';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isAuthenticated, token]);

  const pollForCompletion = useCallback(async (problemId: string) => {
    const maxAttempts = 60; // 2 minutes with 2-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for problem ${problemId}`);
        
        if (!isValidUUID(problemId)) {
          throw new Error('Invalid problem ID format for polling');
        }
        
        // Build query
        let query = supabase
          .from('problem_submissions')
          .select('*')
          .eq('id', problemId);
        
        // Only filter by user if authenticated
        if (isAuthenticated && user?.id && isValidUUID(user.id)) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          console.error('Error polling for completion:', fetchError);
          setError('Failed to check problem status');
          return;
        }

        if (!data) {
          setError('Problem not found');
          return;
        }

        console.log('Poll result:', {
          status: data.status,
          hasSolution: !!data.solution,
        });

        // Update result
        const newResult: ProblemResult = {
          id: data.id,
          status: data.status,
          solution: data.solution || undefined,
          explanation: data.solution || undefined,
          subject: data.topic || data.subject || undefined,
          difficulty: data.difficulty || undefined,
          tags: data.tags || undefined,
          errorMessage: data.error_message || undefined,
        };

        setResult(newResult);

        // Stop polling if completed or error
        if (data.status === 'completed' || data.status === 'error') {
          if (data.status === 'error') {
            setError(data.error_message || 'Problem processing failed');
          }
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('Problem processing timed out');
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Failed to check problem status');
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 1000);
  }, [isAuthenticated, user]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    submitProblem,
    isSubmitting,
    result,
    error,
    clearResult,
  };
}