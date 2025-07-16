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
import { ArrowLeft, Shield, TestTube, Database, Upload, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecureSession } from '@/hooks/useSecureSession';
import { securityManager } from '@/lib/security';
import { mediaUploadManager } from '@/lib/mediaUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import SecureUpload from '@/components/SecureUpload';

export default function SecurityTestScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { session, createSession, endSession, validateSessionSecurity } = useSecureSession();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runSecurityTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsRunningTests(true);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: testName,
        status: 'passed',
        result,
        duration,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, testResult]);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult = {
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, testResult]);
      return testResult;
    } finally {
      setIsRunningTests(false);
    }
  };

  const testInputSanitization = async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      'SELECT * FROM users;',
    ];

    const results = maliciousInputs.map(input => ({
      original: input,
      sanitized: securityManager.sanitizeInput(input)
    }));

    return { inputTests: results };
  };

  const testSessionSecurity = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const sessionId = await createSession();
    if (!sessionId) {
      throw new Error('Failed to create session');
    }

    const isValid = await validateSessionSecurity();
    
    return {
      sessionCreated: !!sessionId,
      sessionValid: isValid,
      sessionId: sessionId
    };
  };

  const testPermissionValidation = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const permissions = await Promise.all([
      securityManager.validateUserPermission(user.id, 'upload_media'),
      securityManager.validateUserPermission(user.id, 'submit_problem'),
      securityManager.validateUserPermission('invalid-uuid', 'upload_media'),
    ]);

    return {
      validUserUpload: permissions[0],
      validUserSubmit: permissions[1],
      invalidUser: permissions[2]
    };
  };

  const testRateLimiting = async () => {
    const testIdentifier = `test_${Date.now()}`;
    const results = [];

    // Test multiple requests
    for (let i = 0; i < 35; i++) {
      const allowed = securityManager.checkRateLimit(testIdentifier);
      results.push({ request: i + 1, allowed });
    }

    const allowedCount = results.filter(r => r.allowed).length;
    const blockedCount = results.filter(r => !r.allowed).length;

    return {
      totalRequests: results.length,
      allowedRequests: allowedCount,
      blockedRequests: blockedCount,
      rateLimitWorking: blockedCount > 0
    };
  };

  const testContentHashing = async () => {
    const testContent = 'This is test content for hashing';
    const hash1 = await securityManager.generateContentHash(testContent);
    const hash2 = await securityManager.generateContentHash(testContent);
    const hash3 = await securityManager.generateContentHash(testContent + ' modified');

    return {
      originalContent: testContent,
      hash1,
      hash2,
      hash3,
      hashesMatch: hash1 === hash2,
      differentContentDifferentHash: hash1 !== hash3
    };
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    await runSecurityTest('Input Sanitization', testInputSanitization);
    await runSecurityTest('Session Security', testSessionSecurity);
    await runSecurityTest('Permission Validation', testPermissionValidation);
    await runSecurityTest('Rate Limiting', testRateLimiting);
    await runSecurityTest('Content Hashing', testContentHashing);
    
    Alert.alert('Tests Complete', 'All security tests have been executed. Check results below.');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Testing</Text>
          <Text style={styles.headerSubtitle}>Validate security implementations</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Session Info */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Session</Text>
          {session ? (
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                Session ID: {session.id.substring(0, 8)}...
              </Text>
              <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                Security Level: {session.securityLevel}
              </Text>
              <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
                Active: {session.isActive ? 'Yes' : 'No'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
              No active session
            </Text>
          )}
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={runAllTests}
            disabled={isRunningTests}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>
              {isRunningTests ? 'Running Tests...' : 'Run All Security Tests'}
            </Text>
            {isRunningTests && <LoadingSpinner size={16} color="#FFFFFF" />}
          </TouchableOpacity>

          {testResults.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.textSecondary }]}
              onPress={clearResults}
            >
              <Text style={[styles.clearButtonText, { color: colors.surface }]}>Clear Results</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Secure Upload Test */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Secure Upload Test</Text>
          <SecureUpload
            onUploadComplete={(uploadId, url) => {
              Alert.alert('Upload Success', `File uploaded with ID: ${uploadId.substring(0, 8)}...`);
            }}
            onUploadError={(error) => {
              Alert.alert('Upload Error', error);
            }}
            bucket="user-uploads"
            folder="security-tests"
          />
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Results</Text>
            
            {testResults.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultCard,
                  { backgroundColor: colors.surface },
                  result.status === 'passed' && { borderLeftColor: colors.success },
                  result.status === 'failed' && { borderLeftColor: colors.error }
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {result.name}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: result.status === 'passed' ? colors.success + '20' : colors.error + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: result.status === 'passed' ? colors.success : colors.error }
                    ]}>
                      {result.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.resultTime, { color: colors.textSecondary }]}>
                  Duration: {result.duration}ms
                </Text>
                
                {result.result && (
                  <View style={[styles.resultData, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.resultDataText, { color: colors.text }]}>
                      {JSON.stringify(result.result, null, 2)}
                    </Text>
                  </View>
                )}
                
                {result.error && (
                  <View style={[styles.errorData, { backgroundColor: colors.error + '10' }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {result.error}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Security Guidelines */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Guidelines</Text>
          
          <View style={[styles.guidelineCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.guidelineTitle, { color: colors.text }]}>Implemented Security Features</Text>
            <Text style={[styles.guidelineText, { color: colors.textSecondary }]}>
              • Input sanitization and validation{'\n'}
              • Secure session management{'\n'}
              • Permission-based access control{'\n'}
              • Rate limiting protection{'\n'}
              • Content integrity verification{'\n'}
              • Audit logging for security events{'\n'}
              • Secure file upload with validation{'\n'}
              • Row-level security (RLS) in database
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionInfo: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  sessionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 12,
    marginBottom: 8,
  },
  resultData: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  errorData: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
  },
  guidelineCard: {
    padding: 16,
    borderRadius: 12,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    lineHeight: 20,
  },
});