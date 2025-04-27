import React, { useState, useEffect } from 'react';
import { Mail, Lock, UserPlus, LogIn, Home, RefreshCw, User, Phone, Key, Repeat } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ApiKeySetup from './ApiKeySetup';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
  returnUrl?: string;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, returnUrl }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

  useEffect(() => {
    const handleEmailVerification = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            navigate('/auth/confirmation/error');
            return;
          }
          
          if (data.user) {
            // Create or update profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata.full_name || null,
                phone: data.user.user_metadata.phone || null,
                updated_at: new Date().toISOString()
              });

            if (profileError) {
              console.error('Profile update error:', profileError);
            }

            navigate('/auth/confirmation/success');
          }
        } catch (error) {
          console.error('Verification error:', error);
          navigate('/auth/confirmation/error');
        } finally {
          setLoading(false);
        }
      }
    };

    handleEmailVerification();
  }, [navigate]);

  // First, ensure we're signed out when component mounts
  useEffect(() => {
    const signOutIfNeeded = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
    };
    signOutIfNeeded();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (confirm: string): boolean => {
    if (!isLogin && password !== confirm) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!validateEmail(email)) {
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess('Password reset instructions have been sent to your email');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setConfirmationEmailSent(false);
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = !isLogin ? validateConfirmPassword(confirmPassword) : true;

    if (!isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setLoading(true);

    try {
      // First ensure we're signed out
      await supabase.auth.signOut();

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          // Enhanced error handling for login failures
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Incorrect email or password. Please try again or use the "Forgot Password" link below.');
          }
          throw error;
        }

        if (data.user) {
          // Check if user has API key
          const { data: apiKeyData } = await supabase
            .from('api_keys')
            .select('gemini_key')
            .eq('user_id', data.user.id)
            .single();

          if (apiKeyData?.gemini_key) {
            // If user has API key, proceed with normal flow
            onAuthSuccess();
            const returnTo = new URLSearchParams(location.search).get('returnTo');
            if (returnTo) {
              navigate(returnTo);
            } else {
              navigate('/');
            }
          } else {
            // If no API key, show API key setup
            setShowApiKeySetup(true);
          }
        }
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim() || null,
              phone: mobile.trim() || null,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          // Enhanced error handling for signup failures
          if (signUpError.message.includes('already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw signUpError;
        }

        if (authData.session === null) {
          setConfirmationEmailSent(true);
          setSuccess('Please check your email to confirm your account before signing in.');
          return;
        }

        if (authData.user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: email.trim(),
              full_name: fullName.trim() || null,
              phone: mobile.trim() || null,
              updated_at: new Date().toISOString()
            });

          if (profileError) throw profileError;

          setSuccess('Registration successful! Redirecting...');
          setShowApiKeySetup(true);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          setError('Too many attempts. Please wait a moment before trying again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showApiKeySetup) {
    return <ApiKeySetup onComplete={onAuthSuccess} returnUrl={returnUrl} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300"
        >
          <Home size={20} />
          <span>Back to Home</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25"></div>
            <div className="relative bg-white p-8 rounded-xl shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {isResetPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {isResetPassword
                    ? 'Enter your email to reset your password'
                    : isLogin
                    ? 'Sign in to access your account'
                    : 'Sign up to get started'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {(success || confirmationEmailSent) && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                      {confirmationEmailSent && (
                        <p className="text-sm text-green-700 mt-2">
                          A confirmation email has been sent. Please check your inbox and click the confirmation link to complete your registration.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={isResetPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
                {!isLogin && !isResetPassword && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-300"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                      }}
                      onBlur={() => validateEmail(email)}
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        emailError ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-300`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                {!isResetPassword && (
                  <>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            validatePassword(e.target.value);
                          }}
                          onBlur={() => validatePassword(password)}
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            passwordError ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-300`}
                          placeholder="Enter your password"
                        />
                      </div>
                      {passwordError && (
                        <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                      )}
                    </div>

                    {!isLogin && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Repeat className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              validateConfirmPassword(e.target.value);
                            }}
                            onBlur={() => validateConfirmPassword(confirmPassword)}
                            className={`block w-full pl-10 pr-3 py-3 border ${
                              confirmPasswordError ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-300`}
                            placeholder="Confirm your password"
                          />
                        </div>
                        {confirmPasswordError && (
                          <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                        )}
                      </div>
                    )}

                    {!isLogin && (
                      <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="mobile"
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-300"
                            placeholder="Enter your mobile number"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading || confirmationEmailSent}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 text-base font-medium transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isResetPassword ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Reset Password
                    </>
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Sign Up
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {isResetPassword ? (
                  <button
                    onClick={() => setIsResetPassword(false)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                        setEmailError(null);
                        setPasswordError(null);
                        setConfirmPasswordError(null);
                        setConfirmationEmailSent(false);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
                    >
                      {isLogin
                        ? "Don't have an account? Sign Up"
                        : 'Already have an account? Sign In'}
                    </button>
                    {isLogin && (
                      <div>
                        <button
                          onClick={() => {
                            setIsResetPassword(true);
                            setError(null);
                            setEmailError(null);
                            setPasswordError(null);
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;