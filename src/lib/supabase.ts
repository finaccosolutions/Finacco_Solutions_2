import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let sessionRefreshInterval: number | null = null;

export const checkSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error checking session:', error.message);
    return null;
  }
  return session;
};

export const clearSession = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error clearing session:', error.message);
    return false;
  }
  stopSessionRefresh();
  return true;
};

export const startSessionRefresh = () => {
  // Clear any existing interval
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
  }

  // Set up new interval to refresh session every 30 minutes
  sessionRefreshInterval = setInterval(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.refreshSession();
      }
    });
  }, 30 * 60 * 1000) as unknown as number; // 30 minutes
};

export const stopSessionRefresh = () => {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
};

export const setupVisibilityChangeHandler = () => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          supabase.auth.refreshSession();
        }
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

export type Database = any; // Replace with your database types