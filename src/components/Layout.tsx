import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Clock, Users, Calendar as CalendarIcon, BarChart2, History, Settings, LogOut, Upload, Skull } from 'lucide-react';
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
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-transparent [text-shadow:none] [-webkit-text-stroke:1px_#FF5500]">
              TrackShi
            </span>
            <Skull size={20} className="text-[#FF5500]" strokeWidth={2.5} />
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-none border text-sm font-mono uppercase tracking-widest transition-all ${
                  isActive
                    ? 'bg-[#FF5500] text-black border-[#FF5500]'
                    : 'bg-transparent text-zinc-500 border-transparent hover:border-zinc-700 hover:text-zinc-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-none border border-transparent text-sm font-mono uppercase tracking-widest text-zinc-500 hover:border-zinc-700 hover:text-zinc-100 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#050505]">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
