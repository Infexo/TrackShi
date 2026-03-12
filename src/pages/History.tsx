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
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Session History</h1>
        <p className="text-gray-500 text-sm">Review and manage your past study sessions.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No sessions found.</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                      {format(new Date(session.date), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {(session.subjects as any)?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDuration(session.duration_minutes)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {format(new Date(session.start_time), 'HH:mm')} - {format(new Date(session.end_time), 'HH:mm')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(session.id, session.duration_minutes)}
                          className="text-gray-400 hover:text-black transition-colors p-2"
                          title="Edit duration"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2"
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
