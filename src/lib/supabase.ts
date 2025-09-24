import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  skills_required: string[];
  application_deadline: string;
  openings_count: number;
  created_by: string;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  student_id: string;
  resume_url: string;
  cover_letter: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'interview_scheduled';
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  scheduled_date: string;
  passcode: string;
  meeting_url: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}