import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          errors.firstName = 'First name must be at least 2 characters';
        } else {
          delete errors.firstName;
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          errors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete errors.lastName;
        }
        break;
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
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(value)) {
          errors.password = 'Password must be at least 8 characters with 1 uppercase letter and 1 number';
        } else {
          delete errors.password;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    
    setFieldErrors(errors);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    
    // Re-validate confirm password if password changes
    if (field === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleRegister = async () => {
    clearError();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field as keyof typeof formData]);
    });
    
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    try {
      await register(formData);
      router.replace('/(tabs)');
    } catch (err) {
      // Error is handled by context
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '') &&
           Object.keys(fieldErrors).length === 0;
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
                <UserPlus size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your learning adventure</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#8A2BE2" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, fieldErrors.firstName && styles.inputError]}
                    placeholder="First name"
                    placeholderTextColor="#AAAAAA"
                    value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    autoCapitalize="words"
                  />
                </View>
                {fieldErrors.firstName && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.firstName}</Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#8A2BE2" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, fieldErrors.lastName && styles.inputError]}
                    placeholder="Last name"
                    placeholderTextColor="#AAAAAA"
                    value={formData.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                    autoCapitalize="words"
                  />
                </View>
                {fieldErrors.lastName && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.lastName}</Text>
                )}
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#8A2BE2" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, fieldErrors.email && styles.inputError]}
                  placeholder="Email address"
                  placeholderTextColor="#AAAAAA"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
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
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
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

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#8A2BE2" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                  placeholder="Confirm password"
                  placeholderTextColor="#AAAAAA"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#8A2BE2" />
                  ) : (
                    <Eye size={20} color="#8A2BE2" />
                  )}
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <Text style={styles.requirementItem}>• At least 8 characters</Text>
              <Text style={styles.requirementItem}>• One uppercase letter</Text>
              <Text style={styles.requirementItem}>• One number</Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, (!isFormValid() || isLoading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!isFormValid() || isLoading}
            >
              <LinearGradient
                colors={isFormValid() && !isLoading ? ['#FFFFFF', '#F0F0F0'] : ['#E5E7EB', '#D1D5DB']}
                style={styles.registerGradient}
              >
                {isLoading ? (
                  <LoadingSpinner size={20} color="#8A2BE2" />
                ) : (
                  <>
                    <Text style={[styles.registerButtonText, (!isFormValid() || isLoading) && styles.buttonTextDisabled]}>
                      Create Account
                    </Text>
                    <ArrowRight size={20} color={isFormValid() && !isLoading ? "#8A2BE2" : "#9CA3AF"} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Sign In</Text>
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
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
  requirementsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '600',
  },
});