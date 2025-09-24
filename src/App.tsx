import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { UserCheck, User, AlertCircle } from 'lucide-react';

function App() {
  const { user, profile, loading, error } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userType, setUserType] = useState<'student' | 'admin'>('student');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated but no profile, show error
  if (user && !profile && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            Your account exists but your profile couldn't be loaded. Please try signing out and back in.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth form
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* User Type Selection */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setUserType('student')}
                  className={`inline-flex items-center px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    userType === 'student'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Student Portal
                </button>
                <button
                  onClick={() => setUserType('admin')}
                  className={`inline-flex items-center px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    userType === 'admin'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  Admin Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        <AuthForm
          mode={authMode}
          userType={userType}
          onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      </div>
    );
  }

  // User is authenticated and has profile
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;