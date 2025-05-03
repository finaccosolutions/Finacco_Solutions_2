import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, checkSession, startSessionRefresh, stopSessionRefresh, setupVisibilityChangeHandler } from '../lib/supabase';

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
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_DELETED'].includes(event)) {
        await checkAuth();
      }
    });

    // Set up visibility change handler
    const cleanupVisibilityHandler = setupVisibilityChangeHandler();

    // Start session refresh
    startSessionRefresh();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      cleanupVisibilityHandler();
      stopSessionRefresh();
    };
  }, [adminOnly]);

  if (!authState.checked) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Store the current location to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;