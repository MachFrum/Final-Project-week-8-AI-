export interface Database {
  public: {
    Tables: {
      problem_submissions: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          input_type: 'text' | 'image' | 'voice';
          text_content: string | null;
          image_url: string | null;
          voice_url: string | null;
          solution: string | null;
          explanation: string | null;
          subject: string | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          tags: string[] | null;
          status: 'pending' | 'processing' | 'completed' | 'error';
          error_message: string | null;
          processing_time_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          input_type: 'text' | 'image' | 'voice';
          text_content?: string | null;
          image_url?: string | null;
          voice_url?: string | null;
          solution?: string | null;
          explanation?: string | null;
          subject?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          tags?: string[] | null;
          status?: 'pending' | 'processing' | 'completed' | 'error';
          error_message?: string | null;
          processing_time_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          input_type?: 'text' | 'image' | 'voice';
          text_content?: string | null;
          image_url?: string | null;
          voice_url?: string | null;
          solution?: string | null;
          explanation?: string | null;
          subject?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          tags?: string[] | null;
          status?: 'pending' | 'processing' | 'completed' | 'error';
          error_message?: string | null;
          processing_time_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          problems_solved: number;
          total_study_time_minutes: number;
          current_streak: number;
          longest_streak: number;
          total_points: number;
          level: number;
          subjects_studied: string[];
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problems_solved?: number;
          total_study_time_minutes?: number;
          current_streak?: number;
          longest_streak?: number;
          total_points?: number;
          level?: number;
          subjects_studied?: string[];
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problems_solved?: number;
          total_study_time_minutes?: number;
          current_streak?: number;
          longest_streak?: number;
          total_points?: number;
          level?: number;
          subjects_studied?: string[];
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}