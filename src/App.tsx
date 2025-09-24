import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { UserCheck, User } from 'lucide-react';

function App() {
  const { user, profile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userType, setUserType] = useState<'student' | 'admin'>('student');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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