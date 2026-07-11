import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole, UserStatus } from '../types';

// ============================================================
// TYPES
// ============================================================

export type AuthUser = UserProfile & {
  email: string;
  avatar_url?: string;
  status?: UserStatus;
};

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  // Role that was requested during OAuth (used by AuthCallbackPage)
  pendingOAuthRole: 'student' | 'seller' | 'admin' | null;

  checkSession: () => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role?: UserRole) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  signInWithGoogle: (role: 'student' | 'seller' | 'admin') => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<boolean>;
  clearError: () => void;
  setPendingOAuthRole: (role: 'student' | 'seller' | 'admin' | null) => void;
}

// ============================================================
// HELPERS
// ============================================================

function buildUserFromProfile(
  session: any,
  profile: any
): AuthUser {
  const meta = session.user?.user_metadata || {};
  return {
    id: session.user.id,
    email: session.user.email || meta.email || '',
    name: profile?.full_name || profile?.name || meta.full_name || meta.name || 'User',
    full_name: profile?.full_name || meta.full_name,
    avatar_url: profile?.avatar_url || meta.avatar_url,
    phone: profile?.phone || meta.phone || '',
    role: (profile?.role || meta.role || 'student') as UserRole,
    status: (profile?.status || meta.status || 'active') as UserStatus,
    created_at: profile?.created_at,
  };
}

// ============================================================
// STORE
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  pendingOAuthRole: null,

  clearError: () => set({ error: null }),

  setPendingOAuthRole: (role) => set({ pendingOAuthRole: role }),

  // ----------------------------------------------------------
  // CHECK SESSION
  // ----------------------------------------------------------
  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: buildUserFromProfile(session, profile),
          loading: false
        });
      } else {
        set({ user: null, loading: false });
      }
    } catch (err: any) {
      console.error('Check Session Error:', err);
      set({ user: null, loading: false, error: err.message });
    }
  },

  // ----------------------------------------------------------
  // SIGN UP
  // ----------------------------------------------------------
  signUp: async (email, password, name, phone, role = 'student') => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name, phone, role }
        }
      });

      if (error) throw error;

      if (data?.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name,
            full_name: name,
            phone,
            role,
            status: 'active'
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

  // ----------------------------------------------------------
  // SIGN IN (email + password)
  // ----------------------------------------------------------
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: buildUserFromProfile({ user: data.user }, profile),
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

  // ----------------------------------------------------------
  // SIGN OUT
  // ----------------------------------------------------------
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false, pendingOAuthRole: null });
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      set({ loading: false, error: err.message });
    }
  },

  // ----------------------------------------------------------
  // UPDATE PROFILE
  // ----------------------------------------------------------
  updateProfile: async (name, phone) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, full_name: name, phone })
        .eq('id', currentUser.id);

      if (error) throw error;

      set({
        user: { ...currentUser, name, full_name: name, phone },
        loading: false
      });
      return true;
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  // ----------------------------------------------------------
  // OTP LOGIN
  // ----------------------------------------------------------
  signInWithOtp: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
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
          user: buildUserFromProfile({ user: data.user }, profile),
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
  },

  // ----------------------------------------------------------
  // GOOGLE SIGN IN — role-aware OAuth redirect
  // Each role gets its own redirectTo so AuthCallbackPage knows
  // what to do after Google returns.
  // ----------------------------------------------------------
  signInWithGoogle: async (role: 'student' | 'seller' | 'admin') => {
    set({ loading: true, error: null, pendingOAuthRole: role });
    try {
      const redirectTo = `${window.location.origin}/auth/callback?state=${role}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            state: role,
          }
        }
      });

      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      set({ loading: false, error: err.message, pendingOAuthRole: null });
      return false;
    }
  },
}));
