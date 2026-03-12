import React, { useState, useEffect } from 'react';
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
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [dailyGoal, setDailyGoal] = useState(0);
  const [streak, setStreak] = useState(0);

  // Break Timer State
  const [lastSessionEndTime, setLastSessionEndTime] = useState<Date | null>(null);
  const [breakSeconds, setBreakSeconds] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  // Interval for active timer
  useEffect(() => {
    let interval: number;
    if (activeSubjectId && sessionStartTime) {
      interval = window.setInterval(() => {
        setElapsedSeconds(Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000));
      }, 1000);
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
    } else {
      console.error("Error saving session:", error);
      alert("Error saving session. Please run the SQL command to add duration_seconds.");
      // Revert optimistic update
      setTodaySessions(prev => prev.filter(s => s.id !== newSession.id));
    }
  };

  const handleToggleTimer = async (subjectId: string) => {
    const now = new Date();
    
    if (activeSubjectId === subjectId) {
      // Stop current
      await saveSession(activeSubjectId, sessionStartTime!, now, elapsedSeconds);
      setActiveSubjectId(null);
      setSessionStartTime(null);
      setElapsedSeconds(0);
      setLastSessionEndTime(now);
      await supabase.from('live_status').upsert({ user_id: user!.id, status: 'offline', subject_id: null, started_at: null });
    } else {
      // If another is running, stop it first
      if (activeSubjectId && sessionStartTime) {
        await saveSession(activeSubjectId, sessionStartTime, now, elapsedSeconds);
      }
      // Start new
      setActiveSubjectId(subjectId);
      setSessionStartTime(now);
      setElapsedSeconds(0);
      setLastSessionEndTime(null);
      setBreakSeconds(0);
      await supabase.from('live_status').upsert({ user_id: user!.id, status: 'studying', subject_id: subjectId, started_at: now.toISOString() });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Track your study sessions. Resets at 4:00 AM.</p>
        </div>
        <div className="flex items-center gap-4">
          {!activeSubjectId && breakSeconds > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time since last session</span>
              <span className="text-lg font-mono font-bold text-gray-400">{formatTime(breakSeconds)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full font-medium">
            <Flame size={20} className={streak > 0 ? "fill-orange-600" : ""} />
            {streak} Day Streak
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Bar */}
          <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Progress</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.floor(totalTodayHours)}h {Math.floor((totalTodaySeconds % 3600) / 60)}m
                  <span className="text-gray-400 text-base font-normal ml-2">/ {dailyGoal}h goal</span>
                </p>
              </div>
              <span className="text-sm font-medium text-gray-500">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-black h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Subjects List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Subjects</h2>
            {subjects.length === 0 ? (
              <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm text-center text-gray-500">
                No subjects added yet. Go to Settings to add some!
              </div>
            ) : (
              subjects.map(subject => {
                const isRunning = activeSubjectId === subject.id;
                const subjectSessions = todaySessions.filter(s => s.subject_id === subject.id);
                const accumulatedSeconds = subjectSessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
                const displaySeconds = accumulatedSeconds + (isRunning ? elapsedSeconds : 0);
                
                return (
                  <div 
                    key={subject.id} 
                    className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all ${isRunning ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}
                    style={{ borderLeftWidth: '6px', borderLeftColor: subject.color || '#3b82f6' }}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      {isRunning && <p className="text-xs text-green-600 font-medium animate-pulse">Recording...</p>}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-mono tracking-tight">{formatTime(displaySeconds)}</span>
                      <button 
                        onClick={() => handleToggleTimer(subject.id)} 
                        className={`p-4 rounded-full transition-colors ${isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-black text-white hover:bg-gray-800'}`}
                      >
                        {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
