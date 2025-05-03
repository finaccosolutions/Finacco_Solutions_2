import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const domain = window.location.origin;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: import.meta.env.DEV,
    retryAttempts: 3,
    redirectTo: `${domain}/auth/callback`,
  }
});

// Optional: Global session checker with retries
export const checkSession = async (retries = 3): Promise<{ session: any; error: any }> => {
  let attempt = 0;

  const attemptCheck = async (): Promise<{ session: any; error: any }> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session && attempt < retries) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          return { session: refreshData.session, error: null };
        }
      }

      return { session, error: null };
    } catch (error) {
      if (attempt < retries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return attemptCheck();
      }
      console.error('Session check failed after retries:', error);
      return { session: null, error };
    }
  };

  return attemptCheck();
};
