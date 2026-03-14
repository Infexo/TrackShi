import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the login link!');
      }
    } catch (err: any) {
      if (err.message !== 'The lock request is aborted') {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-100 p-4">
      <div className="max-w-md w-full p-8 bg-[#0A0A0A] border border-zinc-800 shadow-[0_0_30px_rgba(255,85,0,0.05)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-[#FF5500] uppercase mb-2">TrackShi</h1>
          <p className="text-zinc-500 font-serif italic text-sm">Only droppers allowed</p>
        </div>
        
        <h2 className="text-xl font-mono uppercase tracking-widest mb-6 text-center border-b border-zinc-800 pb-4">
          {isLogin ? 'Authenticate' : 'Initialize'}
        </h2>
        
        {error && <div className="mb-6 p-4 bg-red-950/50 border border-red-900 text-red-400 text-xs font-mono uppercase tracking-widest text-center">{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5500] text-black p-4 font-mono uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-mono text-zinc-500 hover:text-[#FF5500] uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'No account? Sign Up' : 'Proceed to log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
