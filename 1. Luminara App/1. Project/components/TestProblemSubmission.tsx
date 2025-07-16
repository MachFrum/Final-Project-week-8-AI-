import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';

export default function TestProblemSubmission() {
  const { colors } = useTheme();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testSubmitProblem = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing submit-problem function...');
      
      // Direct call to the Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('submit-problem', {
        body: {
          input_type: 'text',
          title: 'Test Problem',
          text_content: 'What is the capital of France?',
          user_id: 'test-user-id'
        }
      });
      
      console.log('Response data:', data);
      console.log('Response error:', functionError);
      
      if (functionError) {
        throw new Error(`Function error: ${JSON.stringify(functionError)}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testGeminiApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing test-gemini function...');
      
      // Direct call to the test-gemini Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('test-gemini', {
        body: {
          prompt: 'What is the capital of France?'
        }
      });
      
      console.log('Response data:', data);
      console.log('Response error:', functionError);
      
      if (functionError) {
        throw new Error(`Function error: ${JSON.stringify(functionError)}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Test Problem Submission</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={testSubmitProblem}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size={16} color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Test Submit Problem</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.success }]}
          onPress={testGeminiApi}
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size={16} color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Test Gemini API</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Error:</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
      
      {result && (
        <View style={[styles.resultContainer, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
          <Text style={[styles.resultTitle, { color: colors.success }]}>Result:</Text>
          <Text style={[styles.resultText, { color: colors.text }]}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}