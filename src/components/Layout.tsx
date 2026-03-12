import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Clock, Users, Calendar as CalendarIcon, BarChart2, History, Settings, LogOut, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Clock },
    { path: '/group', label: 'Group', icon: Users },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/stats', label: 'Stats', icon: BarChart2 },
    { path: '/history', label: 'History', icon: History },
    { path: '/import', label: 'Import', icon: Upload },
    { path: '/profile', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
              TrackShi
            </span>
            <span className="text-xl animate-bounce">💩</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
