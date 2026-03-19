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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-[#FF5500] rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 text-zinc-100">
        <div className="bg-[#0A0A0A] p-8 border border-zinc-800 max-w-md w-full text-center shadow-[0_0_30px_rgba(255,85,0,0.05)]">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#FF5500]">System Error</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-6">
            Supabase configuration missing. Initialize environment variables:
          </p>
          <ul className="text-left text-xs text-zinc-400 bg-[#141414] border border-zinc-800 p-4 mb-6 space-y-2 font-mono">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-xs text-zinc-500 font-serif italic">
            Restart sequence required after configuration.
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
