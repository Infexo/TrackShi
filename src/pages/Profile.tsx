import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';

const COLORS = ['#FF0000', '#00FF00', '#FFFF00', '#00FFFF', '#FF00FF', '#FF5500', '#FFFFFF', '#8800FF'];

export default function Profile() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(COLORS[4]);
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch subjects
    const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', user.id);
    if (subs) setSubjects(subs);

    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setFullName(profile.full_name || '');
      setGroupName(profile.group_name || '');
      setDailyGoal(profile.daily_goal || 0);
    }
    setLoading(false);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    
    const { error } = await supabase.from('subjects').insert({ 
      id: crypto.randomUUID(), // Bypass uuid_generate_v4() in case extension is missing
      user_id: user.id, 
      name: newSubject.trim(),
      color: newSubjectColor
    });
    
    if (error) {
      alert('Error adding subject: ' + error.message + '\n\nMake sure you ran the SQL command to add the color column.');
    } else {
      setNewSubject('');
      fetchData();
    }
  };

  const handleRenameSubject = async (id: string, currentName: string) => {
    const newName = prompt('Enter new subject name:', currentName);
    if (!newName || newName.trim() === currentName) return;
    
    const { error } = await supabase.from('subjects').update({ name: newName.trim() }).eq('id', id);
    if (error) alert('Error renaming subject: ' + error.message);
    else fetchData();
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? This will not delete past sessions, but the subject will be removed from the list.')) return;
    
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) alert('Error deleting subject: ' + error.message);
    else fetchData();
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      group_name: groupName,
      daily_goal: dailyGoal,
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      alert('Error saving profile: ' + error.message + '\n\nIf the error mentions "group_name", please run the SQL command provided in the chat to update your database schema.');
    } else {
      alert('Profile saved successfully.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Settings</h1>
        <p className="text-zinc-500 font-serif italic text-sm">Manage your profile, subjects, and goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Profile Details */}
          <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Username / Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name..."
                  className="w-full p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., StudyBuddies2026"
                  className="w-full p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono transition-colors"
                />
                <p className="text-xs text-zinc-500 font-serif italic mt-2">Join a group by entering the exact same name as your friends.</p>
              </div>
            </div>
          </div>

          {/* Subjects Management */}
          <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Subjects</h2>
            <form onSubmit={handleAddSubject} className="flex flex-col gap-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="New subject name..."
                  className="flex-1 p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#FF5500] text-black px-6 py-3 rounded-none hover:bg-orange-600 transition-colors flex items-center gap-2 font-mono uppercase tracking-widest text-sm"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Color:</span>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjectColor(c)}
                      className={`w-8 h-8 rounded-none border-2 transition-all ${newSubjectColor === c ? 'border-zinc-100 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </form>
            <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-none bg-[#141414]">
              {subjects.map((s) => (
                <li key={s.id} className="p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-none" style={{ backgroundColor: s.color || '#FF5500' }} />
                    <span className="font-bold uppercase tracking-tight text-zinc-100">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleRenameSubject(s.id, s.name)}
                      className="text-zinc-500 hover:text-zinc-100 transition-colors"
                      title="Rename subject"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="text-zinc-500 hover:text-red-500 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="p-6 text-center text-zinc-500 font-serif italic">No subjects added yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          {/* Daily Goal */}
          <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Daily Goal</h2>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="24"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-24 p-3 bg-[#141414] border border-zinc-800 rounded-none focus:outline-none focus:border-[#FF5500] text-zinc-100 font-mono text-center text-xl"
              />
              <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">hours per day</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveProfile}
              className="bg-[#FF5500] text-black px-8 py-4 rounded-none hover:bg-orange-600 transition-colors flex items-center gap-3 font-mono uppercase tracking-widest text-sm"
            >
              <Save size={20} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
