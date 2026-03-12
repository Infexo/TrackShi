/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Group from './pages/Group';
import Calendar from './pages/Calendar';
import Stats from './pages/Stats';
import History from './pages/History';
import Profile from './pages/Profile';
import Import from './pages/Import';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Supabase Configuration Required</h1>
          <p className="text-gray-600 mb-4">
            Please configure your Supabase environment variables in the Secrets panel:
          </p>
          <ul className="text-left text-sm text-gray-500 bg-gray-50 p-4 rounded-md mb-4 space-y-2 font-mono">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-gray-500">
            After adding the secrets, restart the development server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="group" element={<Group />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="stats" element={<Stats />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="import" element={<Import />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
