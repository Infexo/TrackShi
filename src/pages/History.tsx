import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { Trash2, Edit2 } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
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

    const { data: subData } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('user_id', user.id);
    if (subData) setSubjects(subData);

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
    await supabase.from('sessions').update({ 
      duration_minutes: minutes,
      duration_seconds: minutes * 60
    }).eq('id', id);
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await supabase.from('sessions').delete().eq('id', id);
    fetchSessions();
  };

  const formatDuration = (minutes: number, seconds?: number) => {
    const totalSeconds = seconds || minutes * 60;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const filteredSessions = selectedSubject === 'all' 
    ? sessions 
    : sessions.filter(s => s.subject_id === selectedSubject);

  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const dateStr = format(new Date(session.start_time), 'MMMM d, yyyy');
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        sessions: [],
        totalSeconds: 0,
        rawDate: new Date(session.start_time).setHours(0, 0, 0, 0)
      };
    }
    acc[dateStr].sessions.push(session);
    acc[dateStr].totalSeconds += (session.duration_seconds || session.duration_minutes * 60);
    return acc;
  }, {} as Record<string, { date: string, sessions: any[], totalSeconds: number, rawDate: number }>);

  const sortedDates = (Object.values(groupedSessions) as { date: string, sessions: any[], totalSeconds: number, rawDate: number }[]).sort((a, b) => b.rawDate - a.rawDate);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Session History</h1>
          <p className="text-zinc-500 font-serif italic text-sm">Review and manage your past study sessions.</p>
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Filter by Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full sm:w-auto bg-[#141414] border border-zinc-800 text-zinc-100 font-mono text-sm p-2 rounded-none focus:outline-none focus:border-[#FF5500] transition-colors uppercase"
          >
            <option value="all">ALL SUBJECTS</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse bg-[#0A0A0A] border border-zinc-800">Loading...</div>
      ) : sortedDates.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 font-mono uppercase tracking-widest text-xs bg-[#0A0A0A] border border-zinc-800">No sessions found.</div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((group) => (
            <div key={group.date} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100">{group.date}</h2>
                <span className="text-sm font-mono text-[#FF5500] uppercase tracking-widest">Total: {formatDuration(0, group.totalSeconds)}</span>
              </div>
              
              <div className="bg-[#0A0A0A] border border-zinc-800 rounded-none overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#141414] border-b border-zinc-800">
                        <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Subject</th>
                        <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Duration</th>
                        <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Time</th>
                        <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {group.sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-[#141414] transition-colors">
                          <td className="p-4 text-sm font-bold text-zinc-100 uppercase tracking-wider">
                            {(session.subjects as any)?.name || 'Unknown'}
                          </td>
                          <td className="p-4 text-sm text-[#FF5500] font-mono">
                            {formatDuration(session.duration_minutes, session.duration_seconds)}
                          </td>
                          <td className="p-4 text-sm text-zinc-500 font-mono">
                            {format(new Date(session.start_time), 'HH:mm')} &rarr; {format(new Date(session.end_time), 'HH:mm')}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(session.id, session.duration_minutes)}
                                className="flex items-center gap-1.5 bg-transparent border border-zinc-700 text-zinc-400 hover:bg-[#FF5500] hover:text-black hover:border-[#FF5500] transition-colors px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
                                title="Edit duration"
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="flex items-center gap-1.5 bg-transparent border border-zinc-700 text-zinc-400 hover:bg-red-600 hover:text-black hover:border-red-600 transition-colors px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
                                title="Delete session"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-zinc-800">
                  {group.sessions.map((session) => (
                    <div key={session.id} className="p-4 space-y-3 hover:bg-[#141414] transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-zinc-100 uppercase tracking-wider text-sm">
                          {(session.subjects as any)?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-[#FF5500] font-mono">
                          {formatDuration(session.duration_minutes, session.duration_seconds)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {format(new Date(session.start_time), 'HH:mm')} &rarr; {format(new Date(session.end_time), 'HH:mm')}
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => handleEdit(session.id, session.duration_minutes)}
                          className="flex items-center gap-1.5 bg-transparent border border-zinc-700 text-zinc-400 hover:bg-[#FF5500] hover:text-black hover:border-[#FF5500] transition-colors px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="flex items-center gap-1.5 bg-transparent border border-zinc-700 text-zinc-400 hover:bg-red-600 hover:text-black hover:border-red-600 transition-colors px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
