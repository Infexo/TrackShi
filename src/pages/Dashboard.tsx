import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format, subDays } from 'date-fns';
import { getLogicalDayRange } from '../lib/dateUtils';

type Subject = { id: string; name: string; color: string };

export default function Dashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  
  // Timer State
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(() => localStorage.getItem('activeSubjectId'));
  const activeSubjectIdRef = useRef(activeSubjectId);
  
  useEffect(() => {
    activeSubjectIdRef.current = activeSubjectId;
  }, [activeSubjectId]);

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('sessionStartTime');
    return saved ? new Date(saved) : null;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [dailyGoal, setDailyGoal] = useState(0);
  const [streak, setStreak] = useState(0);

  // Break Timer State
  const [lastSessionEndTime, setLastSessionEndTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastSessionEndTime');
    return saved ? new Date(saved) : null;
  });
  const [breakSeconds, setBreakSeconds] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchData();
    resumeTimerFromLiveStatus();

    // Listen for live_status changes to sync across tabs
    const channel = supabase
      .channel(`live_status_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'live_status',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        const status = payload.new;
        if (status && status.status === 'studying' && status.subject_id && status.started_at) {
          if (activeSubjectIdRef.current !== status.subject_id) {
            setActiveSubjectId(status.subject_id);
            setSessionStartTime(new Date(status.started_at));
          }
        } else {
          if (activeSubjectIdRef.current !== null) {
            setActiveSubjectId(null);
            setSessionStartTime(null);
            setElapsedSeconds(0);
            fetchData(); // Refresh sessions when a session is stopped elsewhere
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Persist to localStorage
  useEffect(() => {
    if (activeSubjectId) {
      localStorage.setItem('activeSubjectId', activeSubjectId);
    } else {
      localStorage.removeItem('activeSubjectId');
    }
  }, [activeSubjectId]);

  useEffect(() => {
    if (sessionStartTime) {
      localStorage.setItem('sessionStartTime', sessionStartTime.toISOString());
    } else {
      localStorage.removeItem('sessionStartTime');
    }
  }, [sessionStartTime]);

  useEffect(() => {
    if (lastSessionEndTime) {
      localStorage.setItem('lastSessionEndTime', lastSessionEndTime.toISOString());
    } else {
      localStorage.removeItem('lastSessionEndTime');
    }
  }, [lastSessionEndTime]);

  const resumeTimerFromLiveStatus = async () => {
    if (!user) return;
    const { data: status } = await supabase
      .from('live_status')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (status && status.status === 'studying' && status.subject_id && status.started_at) {
      const startedAt = new Date(status.started_at);
      // Only resume if it's from today (logical day)
      const { start, end } = getLogicalDayRange();
      if (startedAt >= start && startedAt <= end) {
        setActiveSubjectId(status.subject_id);
        setSessionStartTime(startedAt);
      } else {
        // Stale session from yesterday, clear it
        await supabase.from('live_status').upsert({ user_id: user.id, status: 'offline', subject_id: null, started_at: null });
        localStorage.removeItem('activeSubjectId');
        localStorage.removeItem('sessionStartTime');
      }
    }
  };

  // Interval for active timer
  useEffect(() => {
    let interval: number;
    if (activeSubjectId && sessionStartTime) {
      setElapsedSeconds(Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000));
      interval = window.setInterval(() => {
        setElapsedSeconds(Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeSubjectId, sessionStartTime]);

  // Interval for break timer
  useEffect(() => {
    let interval: number;
    if (!activeSubjectId && lastSessionEndTime) {
      interval = window.setInterval(() => {
        setBreakSeconds(Math.floor((new Date().getTime() - lastSessionEndTime.getTime()) / 1000));
      }, 1000);
    } else {
      setBreakSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeSubjectId, lastSessionEndTime]);

  // Tab Indicator (Red Dot)
  useEffect(() => {
    const updateTabIndicator = () => {
      // Find all existing icon links
      const iconLinks = document.querySelectorAll("link[rel~='icon']");
      
      if (activeSubjectId) {
        document.title = "Recording.....";
        
        // Create a red dot favicon
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.arc(16, 16, 12, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF5500';
          ctx.fill();
          const dataUrl = canvas.toDataURL('image/png');
          
          if (iconLinks.length > 0) {
            iconLinks.forEach(link => (link as HTMLLinkElement).href = dataUrl);
          } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = dataUrl;
            document.head.appendChild(link);
          }
        }
      } else {
        document.title = "TrackShi";
        const transparentIcon = "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeg6Q9YAAAAASUVORK5CYII=";
        if (iconLinks.length > 0) {
          iconLinks.forEach(link => (link as HTMLLinkElement).href = transparentIcon);
        } else {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = transparentIcon;
          document.head.appendChild(link);
        }
      }
    };

    updateTabIndicator();

    return () => {
      document.title = "TrackShi";
      const iconLinks = document.querySelectorAll("link[rel~='icon']");
      const transparentIcon = "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeg6Q9YAAAAASUVORK5CYII=";
      iconLinks.forEach(link => (link as HTMLLinkElement).href = transparentIcon);
    };
  }, [activeSubjectId]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch subjects
    const { data: subs } = await supabase.from('subjects').select('*').eq('user_id', user.id);
    if (subs) setSubjects(subs);

    // Fetch today's sessions using 4 AM logic
    const { start, end } = getLogicalDayRange();
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());
    
    setTodaySessions(sessions || []);

    // Fetch daily goal
    const { data: profile } = await supabase.from('profiles').select('daily_goal').eq('id', user.id).single();
    if (profile) {
      setDailyGoal(profile.daily_goal || 0);
    }

    // Calculate Streak (>= 7 hours per day)
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('date, duration_minutes, duration_seconds')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (allSessions) {
      const dailyTotals = new Map<string, number>();
      allSessions.forEach(s => {
        const d = s.date.split('T')[0];
        const secs = s.duration_seconds || (s.duration_minutes * 60);
        dailyTotals.set(d, (dailyTotals.get(d) || 0) + secs);
      });

      let currentStreak = 0;
      let checkDate = new Date();
      
      const todayStr = format(checkDate, 'yyyy-MM-dd');
      if ((dailyTotals.get(todayStr) || 0) >= 420 * 60) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        checkDate = subDays(checkDate, 1);
      }

      while (true) {
        const dStr = format(checkDate, 'yyyy-MM-dd');
        const secs = dailyTotals.get(dStr) || 0;
        if (secs >= 420 * 60) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    }
  };

  const saveSession = async (subjId: string, start: Date, end: Date, seconds: number) => {
    if (seconds <= 0) return; // Don't save empty sessions
    
    // Optimistic update
    const newSession = {
      id: 'temp-' + Date.now(),
      user_id: user!.id,
      subject_id: subjId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: Math.floor(seconds / 60),
      duration_seconds: seconds,
      date: format(start, 'yyyy-MM-dd')
    };
    setTodaySessions(prev => [...prev, newSession]);

    const { error } = await supabase.from('sessions').insert({
      user_id: user!.id,
      subject_id: subjId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: Math.floor(seconds / 60),
      duration_seconds: seconds,
      date: format(start, 'yyyy-MM-dd')
    });
    
    if (!error) {
      fetchData(); // refresh todaySessions
    } else if (error.code === '23503') {
      // Subject was deleted, save without subject_id
      const { error: retryError } = await supabase.from('sessions').insert({
        user_id: user!.id,
        subject_id: null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: Math.floor(seconds / 60),
        duration_seconds: seconds,
        date: format(start, 'yyyy-MM-dd')
      });
      if (!retryError) {
        fetchData();
      } else {
        console.error("Error saving session after retry:", retryError);
        setTodaySessions(prev => prev.filter(s => s.id !== newSession.id));
      }
    } else {
      console.error("Error saving session:", error);
      // Revert optimistic update
      setTodaySessions(prev => prev.filter(s => s.id !== newSession.id));
    }
  };

  const handleToggleTimer = async (subjectId: string) => {
    const now = new Date();
    
    if (activeSubjectId === subjectId) {
      // Stop current
      const currentActive = activeSubjectId;
      const currentStart = sessionStartTime!;
      const currentElapsed = elapsedSeconds;
      
      setActiveSubjectId(null);
      setSessionStartTime(null);
      setElapsedSeconds(0);
      setLastSessionEndTime(now);
      
      saveSession(currentActive, currentStart, now, currentElapsed);
      supabase.from('live_status').upsert({ user_id: user!.id, status: 'offline', subject_id: null, started_at: null });
    } else {
      // If another is running, stop it first
      if (activeSubjectId && sessionStartTime) {
        saveSession(activeSubjectId, sessionStartTime, now, elapsedSeconds);
      }
      // Start new
      setActiveSubjectId(subjectId);
      setSessionStartTime(now);
      setElapsedSeconds(0);
      setLastSessionEndTime(null);
      setBreakSeconds(0);
      supabase.from('live_status').upsert({ user_id: user!.id, status: 'studying', subject_id: subjectId, started_at: now.toISOString() });
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate total seconds for the day
  const totalTodaySeconds = todaySessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0) + (activeSubjectId ? elapsedSeconds : 0);
  const totalTodayHours = totalTodaySeconds / 3600;
  const progressPercentage = dailyGoal > 0 ? Math.min((totalTodayHours / dailyGoal) * 100, 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Dashboard</h1>
          <p className="text-zinc-500 font-serif italic text-sm">Track your study sessions. Resets at 4:00 AM.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!activeSubjectId && breakSeconds > 0 && (
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time since last session</span>
              <span className="text-lg font-mono font-bold text-zinc-300">{formatTime(breakSeconds)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-[#141414] border border-zinc-800 text-[#FF5500] px-4 py-2 rounded-none font-mono text-sm uppercase tracking-widest">
            <Flame size={18} className={streak > 0 ? "fill-[#FF5500]" : ""} />
            {streak} Day Streak
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Progress Bar */}
        <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
              <div
                className="bg-[#FF5500] h-1 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-end mb-4 mt-2">
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Today's Progress</p>
                <p className="text-4xl font-light font-mono tracking-tighter">
                  {Math.floor(totalTodayHours)}<span className="text-xl text-zinc-500">h</span> {Math.floor((totalTodaySeconds % 3600) / 60)}<span className="text-xl text-zinc-500">m</span>
                  <span className="text-zinc-600 text-sm font-serif italic ml-4">/ {dailyGoal}h goal</span>
                </p>
              </div>
              <span className="text-2xl font-mono text-[#FF5500]">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Your Subjects</h2>
            {(() => {
              const displaySubjects = [...subjects];
              if (activeSubjectId && !subjects.find(s => s.id === activeSubjectId)) {
                displaySubjects.unshift({
                  id: activeSubjectId,
                  name: 'Deleted Subject',
                  color: '#555555'
                });
              }
              
              if (displaySubjects.length === 0) {
                return (
                  <div className="bg-[#0A0A0A] p-8 border border-zinc-800 rounded-none text-center text-zinc-500 font-serif italic">
                    No subjects added yet. Go to Settings to add some.
                  </div>
                );
              }
              
              return displaySubjects.map(subject => {
                const isRunning = activeSubjectId === subject.id;
                const subjectSessions = todaySessions.filter(s => s.subject_id === subject.id);
                const accumulatedSeconds = subjectSessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
                const displaySeconds = accumulatedSeconds + (isRunning ? elapsedSeconds : 0);
                
                return (
                  <div 
                    key={subject.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0A0A0A] border rounded-none transition-all ${isRunning ? 'border-[#FF5500] shadow-[0_0_15px_rgba(255,85,0,0.15)]' : 'border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color || '#FF5500', opacity: isRunning ? 1 : 0.5 }}></div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg sm:text-xl tracking-tight uppercase truncate">{subject.name}</h3>
                        {isRunning && <p className="text-xs text-[#FF5500] font-mono uppercase tracking-widest mt-1 animate-pulse">Recording</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                      <span className={`text-2xl sm:text-3xl font-mono tracking-tighter ${isRunning ? 'text-zinc-100' : 'text-zinc-500'}`}>{formatTime(displaySeconds)}</span>
                      <button 
                        onClick={() => handleToggleTimer(subject.id)} 
                        className={`p-4 rounded-none border transition-all shrink-0 ${isRunning ? 'bg-[#FF5500] border-[#FF5500] text-black' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100'}`}
                      >
                        {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                      </button>
                    </div>
                  </div>
                )
              });
            })()}
          </div>
        </div>
    </div>
  );
}
