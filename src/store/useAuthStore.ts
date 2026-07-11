import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthState {
  user: (UserProfile & { email: string }) | null;
  loading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role?: 'student' | 'admin') => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  clearError: () => set({ error: null }),

  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      
      if (sessionErr) throw sessionErr;

      if (session?.user) {
        // Fetch matching profile
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileErr) {
          // If profile fetch fails, build from session user metadata
          const meta = session.user.user_metadata || {};
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: meta.name || 'Student',
              phone: meta.phone || '',
              role: meta.role || 'student'
            },
            loading: false
          });
        } else {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.name,
              phone: profile.phone,
              role: profile.role
            },
            loading: false
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    } catch (err: any) {
      console.error('Check Session Error:', err);
      set({ user: null, loading: false, error: err.message });
    }
  },

  signUp: async (email, password, name, phone, role = 'student') => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, role }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Trigger might insert, but let's make sure it is in profiles if we are on live/mock
        // On mock, the Auth.signUp method already handles profiles insertion.
        // For live mode, we check profiles to confirm it synced.
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name,
            phone,
            role
          },
          loading: false
        });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error('Sign Up Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data?.user) {
        // Fetch matching profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: profile?.name || data.user.user_metadata?.name || 'Student',
            phone: profile?.phone || data.user.user_metadata?.phone || '',
            role: (profile?.role || data.user.user_metadata?.role || 'student') as 'student' | 'admin'
          },
          loading: false
        });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error('Sign In Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false });
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      set({ loading: false, error: err.message });
    }
  },

  updateProfile: async (name, phone) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, phone })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update state
      set({
        user: {
          ...currentUser,
          name,
          phone
        },
        loading: false
      });
      return true;
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  signInWithOtp: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (err: any) {
      console.error('OTP Sign In Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  verifyOtp: async (email: string, token: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      if (error) throw error;

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: profile?.name || data.user.user_metadata?.name || 'Student',
            phone: profile?.phone || data.user.user_metadata?.phone || '',
            role: (profile?.role || data.user.user_metadata?.role || 'student') as 'student' | 'admin'
          },
          loading: false
        });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  }
}));
