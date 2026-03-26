import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Clock, Users, Calendar as CalendarIcon, BarChart2, History, Settings, LogOut, Upload, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GlobalTimer from './GlobalTimer';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Clock },
    { path: '/group', label: 'Group', icon: Users },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/stats', label: 'Stats', icon: BarChart2 },
    { path: '/history', label: 'History', icon: History },
    { path: '/import', label: 'Import', icon: Upload },
    { path: '/profile', label: 'Profile', icon: Settings },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <h1 className="text-2xl font-black tracking-tighter text-zinc-100 uppercase">
          TS
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-[#0A0A0A] border-r border-zinc-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-16 md:pt-0
      `}>
        <div className="hidden md:block p-6 border-b border-zinc-800">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase">
            TS
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
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-3 rounded-none border text-sm font-mono uppercase tracking-widest transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-black border-zinc-100'
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 bg-[#050505]">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      <GlobalTimer />
    </div>
  );
}
