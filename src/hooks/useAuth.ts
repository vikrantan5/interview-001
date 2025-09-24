import { useState, useEffect } from 'react';
import { supabase, type Profile, createUserProfile, getUserProfile } from '../lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

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
    error: null
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setState(prev => ({ ...prev, error: error.message, loading: false }));
          }
          return;
        }

        if (session?.user && mounted) {
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            if (mounted) {
              setState(prev => ({ 
                ...prev, 
                user: session.user, 
                profile: null, 
                error: 'Profile not found', 
                loading: false 
              }));
            }
          } else if (mounted) {
            setState({
              user: session.user,
              profile: profile,
              loading: false,
              error: null
            });
          }
        } else if (mounted) {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        console.error('Unexpected error in getInitialSession:', err);
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to initialize authentication', 
            loading: false 
          }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            // User signed in - try to get profile, create if doesn't exist
            let { data: profile, error: profileError } = await getUserProfile(session.user.id);
            
            if (profileError || !profile) {
              console.log('Profile not found, attempting to create from user metadata');
              
              // Try to create profile from user metadata if available
              const userMetadata = session.user.user_metadata;
              if (userMetadata?.full_name && userMetadata?.role) {
                const { data: newProfile, error: createError } = await createUserProfile(
                  session.user,
                  userMetadata.full_name,
                  userMetadata.role
                );
                
                if (!createError && newProfile) {
                  profile = newProfile;
                  profileError = null;
                }
              }
            }
            
            if (profile) {
              setState({
                user: session.user,
                profile: profile,
                loading: false,
                error: null
              });
            } else {
              setState({
                user: session.user,
                profile: null,
                loading: false,
                error: 'Profile not found. Please contact support.'
              });
            }
          } else {
            // User signed out
            setState({
              user: null,
              profile: null,
              loading: false,
              error: null
            });
          }
        } catch (err) {
          console.error('Error in auth state change handler:', err);
          setState(prev => ({
            ...prev,
            error: 'Authentication error occurred',
            loading: false
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

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: fullName,
            role: role,
          },
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

      // Create or get existing profile
      try {
        const { data: profileData, error: profileError } = await createUserProfile(
          authData.user,
          fullName,
          role
        );

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // If it's a duplicate key error, try to fetch the existing profile
          if (profileError.code === '23505') {
            const { data: existingProfile } = await getUserProfile(authData.user.id);
            if (existingProfile) {
              console.log('Using existing profile');
            }
          }
        }
      } catch (profileErr) {
        console.error('Profile creation/fetch error:', profileErr);
        // Continue anyway, profile will be handled in auth state change
      }

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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { data: null, error };
      }

      // Profile will be fetched in the auth state change handler
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

      // State will be updated in the auth state change handler
      return { error: null };

    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error in signOut:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

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