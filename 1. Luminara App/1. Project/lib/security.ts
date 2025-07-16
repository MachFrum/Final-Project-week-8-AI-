import { supabase } from './supabase';
import { isValidUUID } from '@/utils/uuid';

export interface SecurityConfig {
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  sessionTimeout: number; // in minutes
  maxRequestsPerMinute: number;
  encryptSensitiveData: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav'],
  sessionTimeout: 60, // 1 hour
  maxRequestsPerMinute: 30,
  encryptSensitiveData: true,
};

export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  // Validate file upload security
  validateFileUpload(file: File): { valid: boolean; error?: string } {
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.config.maxFileSize / (1024 * 1024)}MB`
      };
    }

    if (!this.config.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { valid: true };
  }

  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Validate user permissions
  async validateUserPermission(userId: string, action: string, resourceId?: string): Promise<boolean> {
    if (!isValidUUID(userId)) {
      return false;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, is_guest')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return false;
      }

      // Guest users have limited permissions
      if (user.is_guest) {
        const allowedGuestActions = ['read_public', 'submit_problem'];
        return allowedGuestActions.includes(action);
      }

      return true;
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }

  // Create secure session
  async createSecureSession(userId: string): Promise<string | null> {
    if (!isValidUUID(userId)) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: userId,
          session_start: new Date().toISOString(),
          session_metadata: {
            security_level: 'standard',
            created_by: 'app'
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Session creation error:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Secure session creation failed:', error);
      return null;
    }
  }

  // Log security event
  async logSecurityEvent(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          new_values: metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Security logging failed:', error);
    }
  }

  // Rate limiting check
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = this.config.maxRequestsPerMinute;

    const current = this.rateLimitCache.get(identifier);
    
    if (!current || now > current.resetTime) {
      this.rateLimitCache.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  // Content hash for integrity verification
  async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt sensitive data (placeholder - implement with your preferred encryption)
  async encryptSensitiveData(data: string): Promise<string> {
    if (!this.config.encryptSensitiveData) {
      return data;
    }
    
    // Implement actual encryption here
    // For now, return base64 encoded (NOT secure for production)
    return btoa(data);
  }

  // Decrypt sensitive data
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (!this.config.encryptSensitiveData) {
      return encryptedData;
    }
    
    // Implement actual decryption here
    // For now, return base64 decoded (NOT secure for production)
    try {
      return atob(encryptedData);
    } catch {
      return encryptedData;
    }
  }
}

export const securityManager = new SecurityManager();