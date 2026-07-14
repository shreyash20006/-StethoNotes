import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

/**
 * Generic hook for fetching data from Supabase with SWR caching
 * Handles loading, error, and cache invalidation automatically
 */
export const useFetch = <T,>(
  key: string | null,
  fetcher: () => Promise<T>
) => {
  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate, // For manual cache invalidation
  };
};
