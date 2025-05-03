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
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Global session checker with retries and better error handling
export const checkSession = async (retries = 3): Promise<{ session: any; error: any }> => {
  let attempt = 0;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const attemptCheck = async (): Promise<{ session: any; error: any }> => {
    try {
      // First try to get session from storage
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession && parsedSession.access_token) {
          // Validate the stored session
          const { data: { user }, error: validateError } = await supabase.auth.getUser(parsedSession.access_token);
          if (user && !validateError) {
            return { session: parsedSession, error: null };
          }
        }
      }

      // If stored session is invalid or doesn't exist, get fresh session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session && attempt < retries) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData.session) {
          // Store the refreshed session
          localStorage.setItem('supabase.auth.token', JSON.stringify(refreshData.session));
          return { session: refreshData.session, error: null };
        }

        // If refresh failed, wait and retry
        attempt++;
        await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        return attemptCheck();
      }

      // Store valid session
      if (session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
      }

      return { session, error: null };
    } catch (error) {
      if (attempt < retries) {
        attempt++;
        await delay(Math.pow(2, attempt) * 1000);
        return attemptCheck();
      }
      console.error('Session check failed after retries:', error);
      return { session: null, error };
    }
  };

  return attemptCheck();
};

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    // Reload the page to ensure clean state
    window.location.reload();
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Ensure the session is properly stored
    if (session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(session));
    }
  }
});

// Set up periodic session check
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(async () => {
  const { error } = await checkSession();
  if (error) {
    console.error('Periodic session check failed:', error);
    // Force reload if session check fails
    window.location.reload();
  }
}, SESSION_CHECK_INTERVAL);