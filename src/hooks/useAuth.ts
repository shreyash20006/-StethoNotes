import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

/**
 * Hook to get auth user and auth methods
 * Provides a cleaner interface than directly accessing Zustand store
 */
export const useAuth = () => {
  const auth = useAuthStore();
  return auth;
};
