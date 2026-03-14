import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Upload, Image as ImageIcon, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLogicalDayRange } from '../lib/dateUtils';

type GroupMember = {
  id: string;
  name: string;
  status: 'studying' | 'offline';
  subject_name: string | null;
  started_at: string | null;
  today_seconds: number;
  week_seconds: number;
  todo_image_url: string | null;
};

export default function Group() {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchGroupData();

    const subscription = supabase
      .channel('live_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_status' }, () => {
        fetchGroupData();
      })
      .subscribe();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(interval);
    };
  }, []);

  const fetchGroupData = async () => {
    if (!user) return;

    try {
      // Get current user's group
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('group_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      const currentGroupName = currentUserProfile?.group_name;
      setGroupName(currentGroupName || null);

      if (!currentGroupName) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Fetch all profiles in the same group
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('group_name', currentGroupName);

      if (profilesError) throw profilesError;
      if (!profiles) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const { start: todayStart, end: todayEnd } = getLogicalDayRange();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const memberData: GroupMember[] = await Promise.all(
        profiles.map(async (p) => {
          const { data: statusData } = await supabase
            .from('live_status')
            .select('status, subject_id, started_at')
            .eq('user_id', p.id)
            .single();

          let subjectName = null;
          if (statusData?.subject_id) {
            const { data: subject } = await supabase
              .from('subjects')
              .select('name')
              .eq('id', statusData.subject_id)
              .single();
            subjectName = subject?.name;
          }

          const { data: todaySessions } = await supabase
            .from('sessions')
            .select('duration_minutes, duration_seconds')
            .eq('user_id', p.id)
            .gte('start_time', todayStart.toISOString())
            .lte('start_time', todayEnd.toISOString());

          const { data: weekSessions } = await supabase
            .from('sessions')
            .select('duration_minutes, duration_seconds')
            .eq('user_id', p.id)
            .gte('start_time', weekStart.toISOString())
            .lte('start_time', weekEnd.toISOString());

          const { data: todoImage } = await supabase
            .from('todo_images')
            .select('image_url')
            .eq('user_id', p.id)
            .eq('date', todayStr)
            .single();

          const todaySeconds = todaySessions?.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0) || 0;
          const weekSeconds = weekSessions?.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0) || 0;

          return {
            id: p.id,
            name: p.full_name || 'Unknown User',
            status: statusData?.status || 'offline',
            subject_name: subjectName,
            started_at: statusData?.started_at,
            today_seconds: todaySeconds,
            week_seconds: weekSeconds,
            todo_image_url: todoImage?.image_url || null,
          };
        })
      );

      memberData.sort((a, b) => b.today_seconds - a.today_seconds);
      setMembers(memberData);
    } catch (error) {
      console.error("Error fetching group data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${todayStr}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('todo-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('todo-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('todo_images').upsert({
        user_id: user.id,
        date: todayStr,
        image_url: publicUrl
      }, { onConflict: 'user_id,date' });
      
      if (dbError) throw dbError;

      fetchGroupData();
    } catch (error: any) {
      alert('Error uploading image: ' + error.message + '\n\nMake sure you have created the Storage Bucket policies!');
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getLiveDurationSeconds = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const currentTime = now.getTime();
    return Math.floor((currentTime - start) / 1000);
  };

  const getLiveDuration = (startedAt: string) => {
    return formatDuration(getLiveDurationSeconds(startedAt));
  };

  const getStudyTag = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours < 2) return 'sameem';
    if (hours < 4) return 'ali';
    if (hours < 6) return 'arij';
    if (hours < 8) return 'hashim';
    if (hours < 10) return 'amaan';
    return 'muzaib';
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-serif italic">Loading group data...</div>;
  }

  if (!groupName) {
    return (
      <div className="space-y-8">
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Group Dashboard</h1>
          <p className="text-zinc-500 font-serif italic text-sm">See what your friends are studying right now.</p>
        </div>
        <div className="bg-[#0A0A0A] p-8 border border-zinc-800 rounded-none text-center">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-2">You are not in a group</h2>
          <p className="text-zinc-500 font-serif italic mb-8">Join a group to see your friends' study sessions and to-do lists.</p>
          <Link to="/profile" className="bg-[#FF5500] text-black px-8 py-4 rounded-none hover:bg-orange-600 font-mono uppercase tracking-widest text-sm inline-block transition-colors">
            Go to Settings to Join a Group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Group: {groupName}</h1>
        <p className="text-zinc-500 font-serif italic text-sm">See what your friends are studying right now.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0A0A0A] border border-zinc-800 rounded-none overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-[#141414]">
              <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Live Study</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {members.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-serif italic">No members found in this group.</div>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="p-5 flex items-center justify-between hover:bg-[#141414] transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-none flex items-center justify-center font-bold text-zinc-500 font-mono text-xl">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-lg tracking-tight uppercase">{m.name}</p>
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-zinc-900 text-[#FF5500] border border-zinc-800">
                            {getStudyTag(m.today_seconds + (m.status === 'studying' && m.started_at ? getLiveDurationSeconds(m.started_at) : 0))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {m.status === 'studying' ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></span>
                              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                                studying <span className="text-[#FF5500]">{m.subject_name}</span>
                                {m.started_at && ` (${getLiveDuration(m.started_at)})`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-zinc-800"></span>
                              <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">offline</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono text-zinc-100">
                        {formatDuration(m.today_seconds + (m.status === 'studying' && m.started_at ? getLiveDurationSeconds(m.started_at) : 0))} <span className="text-xs text-zinc-500 uppercase tracking-widest ml-1">today</span>
                      </p>
                      <p className="text-sm font-mono text-zinc-500">
                        {formatDuration(m.week_seconds + (m.status === 'studying' && m.started_at ? getLiveDurationSeconds(m.started_at) : 0))} <span className="text-[10px] uppercase tracking-widest ml-1">this week</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0A0A0A] border border-zinc-800 rounded-none overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-[#141414] flex justify-between items-center">
              <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Today's To-Do Lists</h2>
              <label className="cursor-pointer text-zinc-500 hover:text-[#FF5500] transition-colors">
                <Upload size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            <div className="p-4 space-y-4">
              {uploading && <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest text-center py-4">Uploading...</div>}
              {!loading && members.filter(m => m.todo_image_url).length === 0 && !uploading && (
                <div className="text-sm font-serif italic text-zinc-500 text-center py-8 flex flex-col items-center gap-3">
                  <ImageIcon size={24} className="text-zinc-800" />
                  No to-do lists uploaded today.
                </div>
              )}
              {members.filter(m => m.todo_image_url).map(m => (
                <div key={m.id} className="border border-zinc-800 rounded-none overflow-hidden">
                  <div className="bg-[#141414] px-3 py-2 border-b border-zinc-800 text-xs font-mono uppercase tracking-widest text-zinc-400">
                    {m.name}'s List
                  </div>
                  <img src={m.todo_image_url!} alt={`${m.name}'s todo list`} className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
