import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayHours, setSelectedDayHours] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user, currentMonth]);

  const fetchSessions = async () => {
    // Fetch sessions for the visible calendar period
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const { data } = await supabase
      .from('sessions')
      .select('date, duration_minutes, duration_seconds')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());
      
    if (data) setSessions(data);
  };

  const getHeatmapColor = (seconds: number) => {
    const hours = seconds / 3600;
    if (hours === 0) return 'bg-[#141414] border-zinc-800 text-zinc-500';
    if (hours < 2) return 'bg-[#FF5500]/25 border-[#FF5500]/30 text-zinc-300';
    if (hours < 5) return 'bg-[#FF5500]/50 border-[#FF5500]/60 text-zinc-200';
    if (hours < 8) return 'bg-[#FF5500]/75 border-[#FF5500]/80 text-zinc-100';
    return 'bg-[#FF5500] border-[#FF5500] text-black font-bold';
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), date));
    const totalSeconds = daySessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
    setSelectedDayHours(totalSeconds / 3600);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Weekday headers
    const headerRow = (
      <div className="grid grid-cols-7 mb-2" key="header">
        {weekDays.map((wd, i) => (
          <div key={i} className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest py-2">
            {wd}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), cloneDay));
        const totalSeconds = daySessions.reduce((acc, s) => acc + (s.duration_seconds || s.duration_minutes * 60), 0);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
            className={`
              min-h-[100px] p-3 border cursor-pointer transition-all rounded-none
              ${!isCurrentMonth ? 'opacity-30' : ''}
              ${isSelected ? 'ring-2 ring-[#FF5500] ring-inset z-10' : 'hover:border-zinc-500'}
              ${getHeatmapColor(totalSeconds)}
            `}
          >
            <div className="flex flex-col h-full justify-between items-start">
              <span className={`text-sm font-mono ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                {formattedDate}
              </span>
              {totalSeconds > 0 && (
                <span className="text-xs font-mono uppercase tracking-widest mt-auto">
                  {Math.floor(totalSeconds / 3600)}h {Math.floor((totalSeconds % 3600) / 60)}m
                </span>
              )}
            </div>
          </div>
        );
        day = addMonths(day, 0); // Need to add days, not months
        day = new Date(day.setDate(day.getDate() + 1));
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-[#0A0A0A] border border-zinc-800 rounded-none overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141414]">
          <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-none border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-none border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="p-4">
          {headerRow}
          <div className="border-l border-t border-zinc-800">
            {rows}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Calendar</h1>
        <p className="text-zinc-500 font-serif italic text-sm">Track your daily study sessions.</p>
      </div>

      {renderCalendar()}

      {selectedDate && (
        <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none">
          <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h3>
          <p className="text-3xl font-mono tracking-tighter text-zinc-100">
            {Math.floor(selectedDayHours)}<span className="text-xl text-zinc-500">h</span> {Math.round((selectedDayHours % 1) * 60)}<span className="text-xl text-zinc-500">m</span>
          </p>
        </div>
      )}
    </div>
  );
}
