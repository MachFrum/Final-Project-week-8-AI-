import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginScreen() {
  const { login, continueAsGuest, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else {
          delete errors.password;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const handleLogin = async () => {
    clearError();
    
    // Validate all fields
    validateField('email', email);
    validateField('password', password);
    
    if (Object.keys(fieldErrors).length > 0 || !email || !password) {
      return;
    }

    try {
      await login({ email, password, rememberMe });
      router.replace('/(tabs)');
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleGuestAccess = async () => {
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#8A2BE2', '#4B0082']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.logoGradient}
              >
                <User size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#8A2BE2" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, fieldErrors.email && styles.inputError]}
                  placeholder="Email address"
                  placeholderTextColor="#AAAAAA"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateField('email', text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {fieldErrors.email && (
                <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#8A2BE2" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, fieldErrors.password && styles.inputError]}
                  placeholder="Password"
                  placeholderTextColor="#AAAAAA"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    validateField('password', text);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#8A2BE2" />
                  ) : (
                    <Eye size={20} color="#8A2BE2" />
                  )}
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#555'] : ['#FFFFFF', '#F0F0F0']}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <LoadingSpinner size={20} color="#8A2BE2" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <ArrowRight size={20} color="#8A2BE2" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Guest Access */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestAccess}
              disabled={isLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeIcon: {
    padding: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8A2BE2',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8A2BE2',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8A2BE2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '600',
  },
});