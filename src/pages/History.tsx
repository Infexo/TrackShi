import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { Trash2, Edit2 } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*, subjects(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });
    
    if (data) setSessions(data);
    setLoading(false);
  };

  const handleEdit = async (id: string, currentDuration: number) => {
    const newDuration = prompt('Enter new duration in minutes:', currentDuration.toString());
    if (!newDuration) return;
    const minutes = parseInt(newDuration, 10);
    if (isNaN(minutes) || minutes < 0) {
      alert('Invalid duration');
      return;
    }
    await supabase.from('sessions').update({ duration_minutes: minutes }).eq('id', id);
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await supabase.from('sessions').delete().eq('id', id);
    fetchSessions();
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Session History</h1>
        <p className="text-zinc-500 font-serif italic text-sm">Review and manage your past study sessions.</p>
      </div>

      <div className="bg-[#0A0A0A] border border-zinc-800 rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] border-b border-zinc-800">
                <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Date</th>
                <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Subject</th>
                <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Duration</th>
                <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Time</th>
                <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse">Loading...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono uppercase tracking-widest text-xs">No sessions found.</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#141414] transition-colors">
                    <td className="p-4 text-sm text-zinc-300 font-mono whitespace-nowrap">
                      {format(new Date(session.date), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm font-bold text-zinc-100 uppercase tracking-wider">
                      {(session.subjects as any)?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm text-[#FF5500] font-mono">
                      {formatDuration(session.duration_minutes)}
                    </td>
                    <td className="p-4 text-sm text-zinc-500 font-mono">
                      {format(new Date(session.start_time), 'HH:mm')} - {format(new Date(session.end_time), 'HH:mm')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(session.id, session.duration_minutes)}
                          className="text-zinc-500 hover:text-[#FF5500] transition-colors p-2 border border-transparent hover:border-[#FF5500]"
                          title="Edit duration"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-zinc-500 hover:text-red-500 transition-colors p-2 border border-transparent hover:border-red-500"
                          title="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
