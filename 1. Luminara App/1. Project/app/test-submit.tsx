import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, CircleCheck as CheckCircle, Circle as XCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration: number;
}

export default function TestSubmitScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testPayload = {
    user_id: "12345678-1234-5678-1234-567812345678",
    title: "Test Problem",
    input_type: "text",
    text_content: "What is 2+2?"
  };

  const validatePayload = () => {
    const errors: string[] = [];
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(testPayload.user_id)) {
      errors.push('Invalid UUID format for user_id');
    }
    
    // Validate required fields
    if (!testPayload.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!testPayload.input_type) {
      errors.push('Input type is required');
    }
    
    if (!testPayload.text_content.trim()) {
      errors.push('Text content is required');
    }
    
    return errors;
  };

  const submitTestRequest = async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setResult(null);

    try {
      // Validate payload before sending
      const validationErrors = validatePayload();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      console.log('Submitting test request to submit-problem Edge Function...');
      console.log('Payload:', testPayload);

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError);
      }
      
      // Prepare request options
      const requestOptions: any = {
        body: testPayload
      };
      
      // Add authentication if available
      if (session && session.access_token) {
        requestOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
        console.log('Using authentication token for test request');
      } else {
        console.log('No authentication token available - using anonymous request');
      }
      
      // Make the POST request to the Edge Function
      const { data, error } = await supabase.functions.invoke('submit-problem', requestOptions);

      const duration = Date.now() - startTime;

      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        throw new Error(`Edge Function error: ${JSON.stringify(error)}`);
      }

      // Check if the response indicates success
      if (!data || !data.success) {
        throw new Error(`Server error: ${data?.error || 'Unknown error'}`);
      }

      setResult({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        duration: duration
      });

      Alert.alert(
        'Success!',
        `Problem submitted successfully with ID: ${data.problemId}`,
        [{ text: 'OK' }]
      );

    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      console.error('Test request failed:', errorMessage);
      
      setResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        duration: duration
      });

      Alert.alert(
        'Test Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Submit Problem</Text>
          <Text style={styles.headerSubtitle}>Edge Function API Test</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Configuration</Text>
          
          <View style={[styles.configCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Endpoint</Text>
            <Text style={[styles.configValue, { color: colors.primary }]}>
              POST /functions/v1/submit-problem
            </Text>
          </View>

          <View style={[styles.docCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.docTitle, { color: colors.text }]}>Common Error Solutions</Text>
            <Text style={[styles.docText, { color: colors.textSecondary }]}>
              • FunctionsHttpError: Edge Function not deployed or crashed{'\n'}
              • Missing GOOGLE_API_KEY: Environment variable not set{'\n'}
              • Invalid UUID: Check user_id format{'\n'}
              • Network timeout: Check internet connection
            </Text>
          </View>
          <View style={[styles.configCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Request Payload</Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>
                {JSON.stringify(testPayload, null, 2)}
              </Text>
            </View>
          </View>

          <View style={[styles.configCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.configTitle, { color: colors.text }]}>Validation Status</Text>
            {validatePayload().length === 0 ? (
              <View style={styles.validationSuccess}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.validationText, { color: colors.success }]}>
                  All fields valid
                </Text>
              </View>
            ) : (
              <View style={styles.validationError}>
                <XCircle size={16} color={colors.error} />
                <Text style={[styles.validationText, { color: colors.error }]}>
                  {validatePayload().join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Test Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={submitTestRequest}
            disabled={isLoading || validatePayload().length > 0}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.testButtonGradient}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: colors.primary + '30' }]}>
                {isLoading ? (
                  <LoadingSpinner size={24} color={colors.primary} />
                ) : (
                  <Send size={24} color={colors.primary} />
                )}
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>
                  {isLoading ? 'Submitting...' : 'Submit Test Request'}
                </Text>
                <Text style={[styles.testButtonDescription, { color: colors.textSecondary }]}>
                  Send POST request to submit-problem Edge Function
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {result && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Results</Text>
              <TouchableOpacity onPress={clearResults}>
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={[
              styles.resultCard,
              { backgroundColor: colors.surface },
              result.success ? styles.successCard : styles.errorCard
            ]}>
              <View style={styles.resultHeader}>
                {result.success ? (
                  <CheckCircle size={24} color={colors.success} />
                ) : (
                  <XCircle size={24} color={colors.error} />
                )}
                <Text style={[
                  styles.resultTitle,
                  { color: result.success ? colors.success : colors.error }
                ]}>
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </Text>
              </View>

              <View style={styles.resultMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {result.duration}ms
                  </Text>
                </View>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
              </View>

              {result.success && result.data && (
                <View style={styles.resultData}>
                  <Text style={[styles.dataTitle, { color: colors.text }]}>Response Data</Text>
                  <View style={[styles.codeBlock, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
                    <Text style={[styles.codeText, { color: colors.text }]}>
                      {JSON.stringify(result.data, null, 2)}
                    </Text>
                  </View>
                </View>
              )}

              {!result.success && result.error && (
                <View style={styles.resultData}>
                  <Text style={[styles.dataTitle, { color: colors.error }]}>Error Details</Text>
                  <View style={[styles.codeBlock, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
                    <Text style={[styles.codeText, { color: colors.error }]}>
                      {result.error}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Documentation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>API Documentation</Text>
          
          <View style={[styles.docCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.docTitle, { color: colors.text }]}>Expected Response Format</Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>
{`{
  "success": true,
  "problemId": "uuid-string",
  "status": "completed",
  "solution": "AI-generated solution",
  "subject": "Mathematics",
  "difficulty": "easy",
  "tags": ["arithmetic", "basic"]
}`}
              </Text>
            </View>
          </View>

          <View style={[styles.docCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.docTitle, { color: colors.text }]}>Required Fields</Text>
            <Text style={[styles.docText, { color: colors.textSecondary }]}>
              • user_id: Valid UUID v4 format{'\n'}
              • title: Non-empty string{'\n'}
              • input_type: "text", "image", or "voice"{'\n'}
              • text_content: Required for text input type
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
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
    marginBottom: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  configCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  configValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  testButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  testButtonDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  successCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  errorCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  resultData: {
    marginTop: 8,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  docCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  docText: {
    fontSize: 14,
    lineHeight: 20,
  },
});