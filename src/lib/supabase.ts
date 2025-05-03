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

// Enhanced session checker with better error handling and refresh logic
export const checkSession = async (retries = 3): Promise<{ session: any; error: any }> => {
  let attempt = 0;

  const attemptCheck = async (): Promise<{ session: any; error: any }> => {
    try {
      // First try to get the current session
      const { data: { session }, error } = await supabase.auth.getSession();

      // If there's an error or no session, try to refresh
      if (error || !session) {
        if (attempt < retries) {
          attempt++;
          
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          // If refresh successful, return the new session
          if (!refreshError && refreshData.session) {
            return { session: refreshData.session, error: null };
          }
          
          // If refresh failed but we have retries left, wait and try again
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          return attemptCheck();
        }
        
        // If we're out of retries, clear the session and storage
        await clearSession();
        return { 
          session: null, 
          error: error || new Error('Session expired and refresh failed') 
        };
      }

      // Session exists and is valid
      return { session, error: null };
    } catch (error) {
      if (attempt < retries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return attemptCheck();
      }
      
      // If all retries failed, clear the session
      await clearSession();
      console.error('Session check failed after retries:', error);
      return { 
        session: null, 
        error: error instanceof Error ? error : new Error('Session check failed') 
      };
    }
  };

  return attemptCheck();
};

// Clear session and storage
export const clearSession = async () => {
  try {
    await supabase.auth.signOut();
    window.localStorage.removeItem('supabase.auth.token');
    stopSessionRefresh();
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Add session refresh interval
let refreshInterval: number | null = null;

// Start periodic session refresh
export const startSessionRefresh = () => {
  if (refreshInterval) {
    stopSessionRefresh(); // Clear existing interval if any
  }
  
  // Check session every 4 minutes
  refreshInterval = window.setInterval(async () => {
    const { error } = await checkSession();
    if (error) {
      await clearSession();
      window.location.href = '/auth';
    }
  }, 4 * 60 * 1000);

  // Also check immediately
  checkSession().catch(async (error) => {
    console.error('Initial session check failed:', error);
    await clearSession();
    window.location.href = '/auth';
  });
};

// Stop session refresh
export const stopSessionRefresh = () => {
  if (refreshInterval) {
    window.clearInterval(refreshInterval);
    refreshInterval = null;
  }
};