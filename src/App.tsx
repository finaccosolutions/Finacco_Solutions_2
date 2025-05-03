import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import TaxAssistant from './components/TaxAssistant';
import Auth from './components/Auth';
import ApiKeySetup from './components/ApiKeySetup';
import Account from './components/Account';
import EmailConfirmation from './components/EmailConfirmation';
import { supabase } from './lib/supabase';
import AdminLogin from './pages/AdminLogin';
import DocumentTemplates from './pages/DocumentTemplates';
import CreateDocument from './pages/CreateDocument';
import DocumentTemplatesAdmin from './pages/admin/DocumentTemplatesAdmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          setIsAdmin(!!profile?.is_admin);
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        setIsAdmin(!!profile?.is_admin);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HomePage = () => (
  <>
    <Navbar />
    <Hero />
    <Services />
    <About />
    <Contact />
    <Footer />
    <WhatsAppButton />
  </>
);

function App() {
  useEffect(() => {
    document.title = 'Finacco Solutions | Financial & Tech Services';
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed, no need to redirect
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        // Only redirect on explicit sign out
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<Auth onAuthSuccess={() => null} />} />
        <Route path="/auth/callback" element={<Auth onAuthSuccess={() => null} />} />
        <Route path="/auth/confirmation/success" element={
          <EmailConfirmation 
            success={true}
            message="Your email has been successfully verified. You can now sign in to your account."
          />
        } />
        <Route path="/auth/confirmation/error" element={
          <EmailConfirmation 
            success={false}
            message="There was a problem verifying your email. Please try again or contact support."
          />
        } />
        <Route path="/account" element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } />
        <Route path="/tax-assistant" element={
          <ProtectedRoute>
            <TaxAssistant />
          </ProtectedRoute>
        } />
        <Route path="/api-key-setup" element={
          <ProtectedRoute>
            <ApiKeySetup onComplete={() => null} />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <DocumentTemplates />
          </ProtectedRoute>
        } />
        <Route path="/create-document/:templateId" element={
          <ProtectedRoute>
            <CreateDocument />
          </ProtectedRoute>
        } />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/templates" element={
          <ProtectedRoute adminOnly>
            <DocumentTemplatesAdmin />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;