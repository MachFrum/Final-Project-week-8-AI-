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
import { ArrowLeft, TestTube, Zap, Database, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';

// Generate a valid UUID v4 for testing
const generateTestUUID = (): string => {
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

export default function DebugScreen() {
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<string>('');

  const testGeminiApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType('Gemini API');
    
    try {
      console.log('Testing test-gemini function...');
      
      const { data, error: functionError } = await supabase.functions.invoke('test-gemini', {
        body: {
          prompt: 'What is the capital of France? Please provide a brief answer.'
        }
      });
      
      console.log('Gemini API Response data:', data);
      console.log('Gemini API Response error:', functionError);
      
      if (functionError) {
        throw new Error(`Function error: ${JSON.stringify(functionError)}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('Gemini API test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testSubmitProblem = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType('Problem Submission');
    
    try {
      console.log('Testing submit-problem function...');
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      
      // Generate a valid test UUID for user_id
      const testUserId = generateTestUUID();
      console.log('Generated test user ID:', testUserId);
      
      // Validate the generated UUID
      if (!isValidUUID(testUserId)) {
        throw new Error('Generated invalid test UUID');
      }
      
      const testSubmission = {
        input_type: 'text',
        title: 'Test Math Problem',
        text_content: 'What is 2 + 2? Please explain the solution step by step.',
        user_id: testUserId,
        description: 'A simple arithmetic test problem for debugging purposes'
      };
      
      console.log('Test submission data:', testSubmission);
      
      // Prepare request options with auth if available
      const requestOptions: any = {
        body: testSubmission
      };
      
      if (session && session.access_token) {
        requestOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
        console.log('Using authentication token for test');
      } else {
        console.log('No authentication token available for test');
      }
      
      const { data, error: functionError } = await supabase.functions.invoke('submit-problem', requestOptions);
      
      console.log('Submit Problem Response data:', data);
      console.log('Submit Problem Response error:', functionError);
      
      if (functionError) {
        // Handle specific Edge Function errors
        let errorMessage = 'Edge Function failed';
        
        if (functionError.name === 'FunctionsHttpError') {
          errorMessage = 'Edge Function HTTP Error - Function may not be deployed or crashed';
        } else if (functionError.message) {
          errorMessage = functionError.message;
        } else {
          errorMessage = JSON.stringify(functionError);
        }
        
        throw new Error(errorMessage);
      }
      
      setResult({
        ...data,
        testSubmission: testSubmission,
        validation: {
          userIdFormat: isValidUUID(testUserId) ? 'Valid UUID' : 'Invalid UUID',
          userIdValue: testUserId
        }
      });
    } catch (err) {
      console.error('Submit problem test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType('Database Connection');
    
    try {
      console.log('Testing database connection...');
      
      // Test basic database connectivity
      const { data, error: dbError } = await supabase
        .from('problem_submissions')
        .select('id, status, created_at, user_id')
        .limit(5);
      
      console.log('Database Response data:', data);
      console.log('Database Response error:', dbError);
      
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      // Validate UUIDs in the response
      const uuidValidation = data?.map(record => ({
        id: record.id,
        isValidId: isValidUUID(record.id),
        isValidUserId: record.user_id ? isValidUUID(record.user_id) : 'null',
      })) || [];
      
      setResult({
        message: 'Database connection successful',
        recordCount: data?.length || 0,
        sampleRecords: data,
        uuidValidation: uuidValidation
      });
    } catch (err) {
      console.error('Database test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testUserAuthentication = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setTestType('User Authentication');
    
    try {
      console.log('Testing user authentication state...');
      
      const authResult = {
        isAuthenticated: isAuthenticated,
        user: user ? {
          id: user.id,
          isValidId: user.id ? isValidUUID(user.id) : false,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isGuest: user.isGuest,
        } : null,
        timestamp: new Date().toISOString()
      };
      
      console.log('Authentication test result:', authResult);
      setResult(authResult);
    } catch (err) {
      console.error('Authentication test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setTestType('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Debug Console</Text>
          <Text style={styles.headerSubtitle}>Test API Integration & UUID Validation</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>API & System Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={testUserAuthentication}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.accent + '20', colors.accent + '10']}
              style={styles.testButtonGradient}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: colors.accent + '30' }]}>
                <User size={24} color={colors.accent} />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>Test User Authentication</Text>
                <Text style={[styles.testButtonDescription, { color: colors.textSecondary }]}>
                  Verify user session and UUID format validation
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={testGeminiApi}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.testButtonGradient}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: colors.primary + '30' }]}>
                <Zap size={24} color={colors.primary} />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>Test Gemini API</Text>
                <Text style={[styles.testButtonDescription, { color: colors.textSecondary }]}>
                  Verify Google API key and Gemini integration
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={testSubmitProblem}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primaryDark + '20', colors.primaryDark + '10']}
              style={styles.testButtonGradient}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: colors.primaryDark + '30' }]}>
                <TestTube size={24} color={colors.primaryDark} />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>Test Problem Submission</Text>
                <Text style={[styles.testButtonDescription, { color: colors.textSecondary }]}>
                  Test complete problem submission with valid UUID
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            onPress={testDatabaseConnection}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.warning + '20', colors.warning + '10']}
              style={styles.testButtonGradient}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: colors.warning + '30' }]}>
                <Database size={24} color={colors.warning} />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>Test Database Connection</Text>
                <Text style={[styles.testButtonDescription, { color: colors.textSecondary }]}>
                  Verify Supabase database connectivity and UUID validation
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statusHeader}>
              <LoadingSpinner size={20} color={colors.primary} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>Testing {testType}...</Text>
            </View>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Please wait while we test the integration
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={[styles.statusCard, styles.errorCard]}>
            <Text style={[styles.statusTitle, { color: colors.error }]}>❌ Test Failed</Text>
            <Text style={[styles.statusSubtitle, { color: colors.error }]}>Test: {testType}</Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
              <Text style={[styles.codeText, { color: colors.error }]}>{error}</Text>
            </View>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.error }]}
              onPress={clearResults}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Display */}
        {result && !error && (
          <View style={[styles.statusCard, styles.successCard]}>
            <Text style={[styles.statusTitle, { color: colors.success }]}>✅ Test Successful</Text>
            <Text style={[styles.statusSubtitle, { color: colors.success }]}>Test: {testType}</Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.success + '10', borderColor: colors.success }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>
                {JSON.stringify(result, null, 2)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.success }]}
              onPress={clearResults}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug Information</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Current User Session</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • User ID: {user?.id ? (isValidUUID(user.id) ? '✅ Valid UUID' : '❌ Invalid UUID') : '❌ No ID'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Guest User: {user?.isGuest ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Email: {user?.email || 'Not set'}
            </Text>
          </View>
          
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Environment Variables</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • EXPO_PUBLIC_SUPABASE_URL: {process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • EXPO_PUBLIC_SUPABASE_ANON_KEY: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • GOOGLE_API_KEY: Check Supabase Edge Function settings
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Common Issues & Solutions</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              1. UUID Format Errors: Ensure all user IDs are valid UUID v4 format
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              2. GOOGLE_API_KEY not set in Supabase Edge Function environment
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              3. Edge Function not deployed or has syntax errors
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              4. Database permissions or RLS policies blocking access
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              5. Network connectivity issues
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
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
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
  },
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});