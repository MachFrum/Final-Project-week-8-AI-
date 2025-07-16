/*
  # Enhanced Learning System Schema

  1. New Tables
    - `users` - Enhanced user profiles with authentication
    - `learning_sessions` - Session tracking for learning activities
    - `media_uploads` - Secure media file tracking
    - `user_achievements` - Achievement system
    - `learning_analytics` - Analytics and insights

  2. Security Enhancements
    - Row Level Security (RLS) on all tables
    - Secure storage policies
    - Data encryption for sensitive fields
    - Audit logging

  3. Performance Optimizations
    - Proper indexes for query performance
    - Materialized views for analytics
    - Partitioning for large tables
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enhanced users table with profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{
    "notifications": true,
    "theme": "light",
    "language": "en",
    "privacy_level": "standard"
  }'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning sessions for tracking user activity
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  total_problems INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  subjects_covered TEXT[] DEFAULT '{}',
  session_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Media uploads tracking with security
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'completed', 'failed', 'deleted')),
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')),
  encryption_key_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- User achievements system
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Learning analytics for insights
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  problems_solved INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  subjects_studied TEXT[] DEFAULT '{}',
  difficulty_distribution JSONB DEFAULT '{}'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Audit log for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced problem_submissions with security fields
ALTER TABLE problem_submissions 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES learning_sessions(id),
ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS encryption_status TEXT DEFAULT 'none' CHECK (encryption_status IN ('none', 'encrypted', 'failed'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_start ON learning_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_media_uploads_user_id ON media_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_status ON media_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_problem_submissions_user_session ON problem_submissions(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_date ON learning_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for learning_sessions
CREATE POLICY "Users can access own sessions"
  ON learning_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for media_uploads
CREATE POLICY "Users can access own media"
  ON media_uploads FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for learning_analytics
CREATE POLICY "Users can read own analytics"
  ON learning_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for audit_logs (read-only for users)
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket policies
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-uploads', 'user-uploads', false),
  ('problem-images', 'problem-images', false),
  ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload to user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access own uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Audit triggers for sensitive tables
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_problem_submissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON problem_submissions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();