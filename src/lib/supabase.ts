import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Get the current domain for redirects
const domain = window.location.origin;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: true,
    redirectTo: `${domain}/auth/callback`,
    onAuthStateChange: (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any auth-related storage
        window.localStorage.removeItem('supabase.auth.token');
        window.location.href = '/';
      }
    }
  }
});