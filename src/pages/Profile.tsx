import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

export default function Profile() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(COLORS[4]);
  const [fullName, setFullName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [whitelist, setWhitelist] = useState('');
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
      setWhitelist(profile.focus_whitelist || '');
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
      focus_whitelist: whitelist,
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile, subjects, and goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Profile Details */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username / Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., StudyBuddies2026"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Join a group by entering the exact same name as your friends.</p>
              </div>
            </div>
          </div>

          {/* Subjects Management */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Subjects</h2>
            <form onSubmit={handleAddSubject} className="flex flex-col gap-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="New subject name..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500">Color:</span>
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjectColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newSubjectColor === c ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </form>
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md">
              {subjects.map((s) => (
                <li key={s.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#3b82f6' }} />
                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRenameSubject(s.id, s.name)}
                      className="text-gray-400 hover:text-black transition-colors"
                      title="Rename subject"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="p-4 text-center text-sm text-gray-500">No subjects added yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          {/* Daily Goal */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Daily Goal</h2>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                min="0"
                max="24"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm"
              />
              <span className="text-sm text-gray-600">hours per day</span>
            </div>
          </div>

          {/* Focus Whitelist */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Focus Whitelist</h2>
            <p className="text-xs text-gray-500 mb-4">Enter allowed websites during focus mode (one per line).</p>
            <textarea
              value={whitelist}
              onChange={(e) => setWhitelist(e.target.value)}
              rows={5}
              placeholder="youtube.com&#10;google.com"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-black text-sm font-mono mb-4"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium"
            >
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
