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
    persistSession: true, // Enable session persistence
    autoRefreshToken: true, // Enable automatic token refresh
    detectSessionInUrl: true,
    storage: localStorage, // Use localStorage for session storage
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    debug: import.meta.env.DEV, // Only enable debug in development
    retryAttempts: 3, // Number of retry attempts for failed requests
    persistSessionTimeout: 3600, // Session timeout in seconds (1 hour)
    cookieOptions: {
      sameSite: 'lax', // Allow cross-site session sharing
      secure: window.location.protocol === 'https:', // Use secure cookies in production
      domain: window.location.hostname, // Share cookies across subdomains
      path: '/', // Make cookies available across all paths
    },
    detectSessionInUrl: false, // Disable automatic URL parsing to handle it manually
    onAuthStateChange: (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Only clear auth storage on explicit sign out
        localStorage.removeItem('supabase.auth.token');
        window.location.href = '/';
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Update the auth state in all open tabs
        localStorage.setItem('supabase.auth.event', JSON.stringify({
          event,
          session,
          timestamp: Date.now()
        }));
      }
    }
  }
});

// Listen for auth events across tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'supabase.auth.event') {
    try {
      const { event: authEvent, session } = JSON.parse(event.newValue || '');
      if (authEvent === 'SIGNED_OUT') {
        window.location.reload();
      } else if (authEvent === 'SIGNED_IN' || authEvent === 'TOKEN_REFRESHED') {
        // Refresh the page to update the auth state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing auth event:', error);
    }
  }
});

// Initialize auth state from storage
const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Refresh token if needed
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      // Handle refresh error (e.g., redirect to login)
      if (error.message.includes('expired')) {
        window.location.href = '/auth';
      }
    }
  }
};

// Run initialization
initializeAuth().catch(console.error);

// Export a helper function to check auth state
export const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error checking auth:', error);
    return null;
  }
  return session;
};