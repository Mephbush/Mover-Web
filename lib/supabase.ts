import { createClient } from '@supabase/supabase-js';

// سيتم تعبئة هذه القيم تلقائياً من Figma Make
const supabaseUrl = 'https://uynclowpzanosjutanpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bmNsb3dwemFub3NqdXRhbnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTI5NDAsImV4cCI6MjA4MDk4ODk0MH0.7rioLTlxHVVOmwOT7vM13JqnwCaMA3E_C0NGFvpKJnQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// أنواع قاعدة البيانات
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          type: string;
          status: string;
          script: string;
          target_url: string;
          schedule: string | null;
          created_at: string;
          updated_at: string;
          last_run: string | null;
          metadata: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description: string;
          type: string;
          status?: string;
          script: string;
          target_url: string;
          schedule?: string | null;
          created_at?: string;
          updated_at?: string;
          last_run?: string | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          type?: string;
          status?: string;
          script?: string;
          target_url?: string;
          schedule?: string | null;
          created_at?: string;
          updated_at?: string;
          last_run?: string | null;
          metadata?: any;
        };
      };
      execution_logs: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          task_name: string;
          status: string;
          start_time: string;
          end_time: string | null;
          duration: number | null;
          logs: string[];
          screenshot: string | null;
          data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          task_name: string;
          status: string;
          start_time: string;
          end_time?: string | null;
          duration?: number | null;
          logs: string[];
          screenshot?: string | null;
          data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          task_name?: string;
          status?: string;
          start_time?: string;
          end_time?: string | null;
          duration?: number | null;
          logs?: string[];
          screenshot?: string | null;
          data?: any;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          github_token: string | null;
          github_repo: string | null;
          github_branch: string | null;
          stealth_settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          github_token?: string | null;
          github_repo?: string | null;
          github_branch?: string | null;
          stealth_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          github_token?: string | null;
          github_repo?: string | null;
          github_branch?: string | null;
          stealth_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
