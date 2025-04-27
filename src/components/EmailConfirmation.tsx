import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Home, LogIn } from 'lucide-react';

interface EmailConfirmationProps {
  success: boolean;
  message: string;
}

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ success, message }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className={`absolute -inset-1 bg-gradient-to-r ${success ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'} rounded-xl blur opacity-25`}></div>
            <div className="relative bg-white p-8 rounded-xl shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                {success ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
                <h2 className={`text-3xl font-bold ${success ? 'text-green-600' : 'text-red-600'} mb-4`}>
                  {success ? 'Email Verified!' : 'Verification Failed'}
                </h2>
                <p className="text-gray-600">{message}</p>
              </div>

              <div className="space-y-4">
                <Link
                  to="/auth"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium transition-all duration-300"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Link>

                <Link
                  to="/"
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium transition-all duration-300"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;