import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subDays, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Trophy, Target, Clock, Calendar, Zap } from 'lucide-react';

export default function Stats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [longestSession, setLongestSession] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    
    // Fetch subjects for colors
    const { data: subjects } = await supabase.from('subjects').select('id, name, color').eq('user_id', user.id);
    const colorMap = new Map();
    subjects?.forEach(s => colorMap.set(s.name, s.color));

    // Fetch all sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('duration_minutes, duration_seconds, date, subject_id, subjects(name)')
      .eq('user_id', user.id);

    if (!sessions) {
      setLoading(false);
      return;
    }

    // Check for active session to include in live stats
    const { data: liveStatus } = await supabase
      .from('live_status')
      .select('*, subjects(name)')
      .eq('user_id', user.id)
      .single();

    if (liveStatus && liveStatus.status === 'studying' && liveStatus.started_at) {
      const startedAt = new Date(liveStatus.started_at);
      const now = new Date();
      const liveSecs = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      
      if (liveSecs > 0) {
        sessions.push({
          duration_minutes: Math.floor(liveSecs / 60),
          duration_seconds: liveSecs,
          date: format(startedAt, 'yyyy-MM-dd'),
          subject_id: liveStatus.subject_id,
          subjects: liveStatus.subjects
        });
      }
    }

    const totalSecs = sessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
    setTotalSeconds(totalSecs);

    // Longest Session
    const maxSecs = sessions.reduce((max, s) => Math.max(max, s.duration_seconds || s.duration_minutes * 60), 0);
    setLongestSession(maxSecs);

    // Calculate daily average
    if (sessions.length > 0) {
      const sortedDates = sessions.map(s => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const today = new Date();
      const daysDiff = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)) + 1);
      setDailyAvg(totalSecs / daysDiff);
      setWeeklyAvg((totalSecs / daysDiff) * 7);
    }

    // Weekly Graph Data (Last 7 Days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    const weekData = last7Days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
      const secs = daySessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
      return {
        name: format(day, 'EEE'),
        hours: Number((secs / 3600).toFixed(2))
      };
    });
    setWeeklyData(weekData);

    // Monthly Trend (Last 30 Days)
    const last30Days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), 29 - i));
    const trendData = last30Days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
      const secs = daySessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
      return {
        date: format(day, 'MMM d'),
        hours: Number((secs / 3600).toFixed(2))
      };
    });
    setMonthlyTrend(trendData);
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading stats...</div>;
  }

  // Find max hours for Y-axis scaling
  const maxWeeklyHours = Math.max(...weeklyData.map(d => d.hours), 1);
  const maxMonthlyHours = Math.max(...monthlyTrend.map(d => d.hours), 1);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Statistics</h1>
        <p className="text-gray-500 text-sm">Deep dive into your study habits and performance.</p>
      </div>

      {/* Hero Stats - Subtle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-100 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Time</span>
          <p className="text-xl font-bold text-gray-600">{formatDuration(totalSeconds)}</p>
        </div>

        <div className="bg-white p-4 border border-gray-100 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Daily Average</span>
          <p className="text-xl font-bold text-gray-600">{formatDuration(dailyAvg)}</p>
        </div>

        <div className="bg-white p-4 border border-gray-100 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Longest Session</span>
          <p className="text-xl font-bold text-gray-600">{formatDuration(longestSession)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Weekly Activity */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Last 7 Days Activity</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={14} />
              <span>Current Week</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, Math.max(1, Math.ceil(maxWeeklyHours))]}
                />
                <Tooltip 
                  cursor={{ fill: '#fee2e2', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#dc2626" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-8">30-Day Study Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                interval={4}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                domain={[0, Math.max(1, Math.ceil(maxMonthlyHours))]}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#dc2626" 
                strokeWidth={3} 
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
