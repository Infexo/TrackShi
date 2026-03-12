import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { startOfWeek, endOfWeek, subDays, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Stats() {
  const { user } = useAuth();
  const [totalHours, setTotalHours] = useState(0);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);

  const COLORS = ['#1f2937', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'];

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    // Fetch all sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('duration_minutes, date, subject_id, subjects(name)')
      .eq('user_id', user.id);

    if (!sessions) return;

    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
    setTotalHours(totalMinutes / 60);

    // Calculate daily average (based on days since first session)
    if (sessions.length > 0) {
      const sortedDates = sessions.map(s => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const today = new Date();
      const daysDiff = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)));
      setDailyAvg((totalMinutes / 60) / daysDiff);
      setWeeklyAvg(((totalMinutes / 60) / daysDiff) * 7);
    }

    // Weekly Graph Data
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weekData = days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
      const mins = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
      return {
        name: format(day, 'EEE'),
        hours: Number((mins / 60).toFixed(1))
      };
    });
    setWeeklyData(weekData);

    // Subject Distribution
    const subjectMap = new Map();
    sessions.forEach(s => {
      const name = (s.subjects as any)?.name || 'Unknown';
      subjectMap.set(name, (subjectMap.get(name) || 0) + s.duration_minutes);
    });

    const subData = Array.from(subjectMap.entries()).map(([name, mins]) => ({
      name,
      value: Number((mins / 60).toFixed(1))
    })).sort((a, b) => b.value - a.value);
    setSubjectData(subData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Statistics</h1>
        <p className="text-gray-500 text-sm">Analyze your study patterns and subject distribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Hours</h2>
          <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Weekly Average</h2>
          <p className="text-3xl font-bold text-gray-900">{weeklyAvg.toFixed(1)}h</p>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Daily Average</h2>
          <p className="text-3xl font-bold text-gray-900">{dailyAvg.toFixed(1)}h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">This Week</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="hours" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Subject Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {subjectData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="font-medium ml-auto">{item.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
