import { useState, useEffect } from 'react';
import { supabase, type Profile, createUserProfile, getUserProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user && mounted) {
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            setState(prev => ({
              ...prev,
              user: session.user,
              profile: null,
              error: 'Profile not found',
              loading: false,
            }));
          } else {
            setState({
              user: session.user,
              profile,
              loading: false,
              error: null,
            });
          }
        } else {
          setState({ user: null, profile: null, loading: false, error: null });
        }
      } catch (err) {
        console.error('Unexpected error in getInitialSession:', err);
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: 'Failed to initialize authentication',
            loading: false,
          }));
        }
      }
    };

    getInitialSession();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          if (session?.user) {
            let { data: profile, error: profileError } = await getUserProfile(session.user.id);

            if (profileError || !profile) {
              console.log('Profile not found, creating one...');
              const userMetadata = session.user.user_metadata;

              if (userMetadata?.full_name && userMetadata?.role) {
                const { data: newProfile } = await createUserProfile(
                  session.user,
                  userMetadata.full_name,
                  userMetadata.role
                );
                profile = newProfile ?? null;
              }
            }

            setState({
              user: session.user,
              profile,
              loading: false,
              error: profile ? null : 'Profile not found. Please contact support.',
            });
          } else {
            setState({ user: null, profile: null, loading: false, error: null });
          }
        } catch (err) {
          console.error('Error in auth state change handler:', err);
          setState(prev => ({
            ...prev,
            error: 'Authentication error occurred',
            loading: false,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'admin') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (authError) {
        setState(prev => ({ ...prev, loading: false, error: authError.message }));
        return { data: null, error: authError };
      }

      if (!authData.user) {
        const error = new Error('User creation failed');
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      // create profile in parallel
      await createUserProfile(authData.user, fullName, role);

      setState(prev => ({ ...prev, loading: false }));
      return { data: authData, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error in signUp:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error in signIn:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }

      return { error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error in signOut:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
    clearError,
  };
}
