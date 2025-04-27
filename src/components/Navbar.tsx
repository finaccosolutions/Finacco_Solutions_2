import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Brain, LogIn, UserPlus, LogOut, User, ChevronDown, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          setIsAdmin(!!profile?.is_admin);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        setIsAdmin(!!profile?.is_admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      window.location.reload(); // Force reload to clear all states
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/?section=${id}`);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/') {
      const section = new URLSearchParams(location.search).get('section');
      if (section) {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [location]);

  const AccountMenu = () => (
    <div ref={accountMenuRef} className="relative">
      <button
        onClick={() => setShowAccountMenu(!showAccountMenu)}
        className="flex items-center gap-2 text-gray-100 hover:text-white font-medium transition-all duration-300 relative group px-4 py-2 rounded-lg hover:bg-white/10"
      >
        <User size={20} />
        <span>Account</span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${showAccountMenu ? 'rotate-180' : ''}`} />
      </button>

      {showAccountMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          {user ? (
            <>
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">Signed in</p>
              </div>
              <Link
                to="/account"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAccountMenu(false)}
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>My Profile</span>
                </div>
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin/templates"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>Document Templates</span>
                    </div>
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>Admin Panel</span>
                    </div>
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </div>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAccountMenu(false)}
              >
                <div className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Sign In</span>
                </div>
              </Link>
              <Link
                to="/auth"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAccountMenu(false)}
              >
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span>Sign Up</span>
                </div>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );

  const navigationItems = ['home', 'services', 'about', 'contact'];
  if (user) {
    navigationItems.push('tax-assistant');
  }

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-gradient-to-r from-blue-900 to-indigo-900 shadow-md py-2' 
            : 'bg-gradient-to-r from-blue-800 to-indigo-800 py-4'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-white">
            <Logo />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button 
                key={item}
                onClick={() => item === 'tax-assistant' ? navigate('/tax-assistant') : scrollToSection(item)} 
                className="text-gray-100 hover:text-white font-medium transition-all duration-300 relative group px-4 py-2 rounded-lg hover:bg-white/10 flex items-center"
              >
                {item === 'tax-assistant' && <Brain size={20} className="mr-2" />}
                {item === 'tax-assistant' ? 'Tax AI Assistant' : item.charAt(0).toUpperCase() + item.slice(1)}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white transform -translate-x-1/2 group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}

            <AccountMenu />
          </nav>
          
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-gradient-to-r from-blue-900 to-indigo-900 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="container mx-auto px-4 py-5 flex justify-between items-center">
          <Link to="/" className="text-white" onClick={() => setIsOpen(false)}>
            <Logo />
          </Link>
          <button
            className="text-white focus:outline-none"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col space-y-6 px-8 py-8">
          {navigationItems.map((item) => (
            <button 
              key={item}
              onClick={() => {
                if (item === 'tax-assistant') {
                  navigate('/tax-assistant');
                } else {
                  scrollToSection(item);
                }
                setIsOpen(false);
              }}
              className="text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg flex items-center"
            >
              {item === 'tax-assistant' && <Brain size={24} className="mr-2" />}
              {item === 'tax-assistant' ? 'Tax AI Assistant' : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}

          {user ? (
            <>
              <div className="px-4 py-2 border-t border-white/10">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-white/70">Signed in</p>
              </div>
              <Link
                to="/account"
                className="flex items-center space-x-2 text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                <User size={24} />
                <span>My Profile</span>
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin/templates"
                    className="flex items-center space-x-2 text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield size={24} />
                    <span>Document Templates</span>
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-2 text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield size={24} />
                    <span>Admin Panel</span>
                  </Link>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-xl text-red-300 hover:text-red-200 font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
              >
                <LogOut size={24} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="flex items-center space-x-2 text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                <LogIn size={24} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/auth"
                className="flex items-center space-x-2 text-xl text-gray-100 hover:text-white font-medium transition-all duration-300 transform hover:translate-x-2 hover:bg-white/10 px-4 py-2 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                <UserPlus size={24} />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-20 hover:bg-blue-700 transform hover:scale-110 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
        </svg>
      </button>
    </>
  );
};

export default Navbar;