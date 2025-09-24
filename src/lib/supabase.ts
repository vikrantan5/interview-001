import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // keep PKCE flow for security
  },
});

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
  jobs?: {
    title: string;
    description: string;
    application_deadline: string;
  };
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

// =======================
// Auth helper functions
// =======================

export const createUserProfile = async (
  user: { id: string; email: string },
  fullName: string,
  role: UserRole
) => {
  // ✅ use maybeSingle (avoids PGRST116 when no row exists)
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) return { data: null, error: selectError };

  if (existingProfile) {
    return { data: existingProfile, error: null };
  }

  // ✅ insert or update profile
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: role,
      },
      { onConflict: 'id' }
    )
    .select()
    .maybeSingle(); // safer than .single()

  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  // ✅ use maybeSingle instead of single
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { data, error };
};
