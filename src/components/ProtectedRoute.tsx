import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, checkSession } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const [authState, setAuthState] = useState({
    checked: false,
    isAuthenticated: false,
    isAdmin: false,
  });
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { session, error } = await checkSession();
        
        if (error || !session) {
          if (mounted) {
            setAuthState({
              checked: true,
              isAuthenticated: false,
              isAdmin: false,
            });
          }
          return;
        }

        // Check admin status if needed
        let isAdmin = false;
        if (session && adminOnly) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
          isAdmin = !!profile?.is_admin;
        }

        if (mounted) {
          setAuthState({
            checked: true,
            isAuthenticated: !!session,
            isAdmin,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setAuthState({
            checked: true,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      }
    };

    // Initial check
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || event === 'TOKEN_REFRESHED') {
        checkAuth(); // Recheck auth state on these events
      }
    });

    // Periodic session check (every 5 minutes)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [adminOnly]);

  if (!authState.checked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Store the current location to redirect back after login
    return <Navigate to="/auth" state={{ returnTo: location.pathname }} replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;