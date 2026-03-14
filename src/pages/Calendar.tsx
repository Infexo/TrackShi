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
    if (hours === 0) return 'bg-white';
    if (hours < 2) return 'bg-red-600/25 border-red-200';
    if (hours < 5) return 'bg-red-600/50 border-red-300';
    if (hours < 8) return 'bg-red-600/75 border-red-400 text-white';
    return 'bg-red-600 border-red-700 text-white';
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
          <div key={i} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">
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
              min-h-[80px] p-2 border border-gray-100 cursor-pointer transition-all
              ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/50' : 'text-gray-700'}
              ${isSelected ? 'ring-2 ring-black ring-inset z-10' : 'hover:border-gray-300'}
              ${getHeatmapColor(totalSeconds)}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                {formattedDate}
              </span>
              {totalSeconds > 0 && (
                <span className="text-xs font-semibold opacity-75">
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="p-4">
          {headerRow}
          <div className="border-l border-t border-gray-100">
            {rows}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Calendar</h1>
        <p className="text-gray-500 text-sm">Track your daily study sessions.</p>
      </div>

      {renderCalendar()}

      {selectedDate && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h3>
          <p className="text-gray-700">
            Total studied: <span className="font-bold">{Math.floor(selectedDayHours)}h {Math.round((selectedDayHours % 1) * 60)}m</span>
          </p>
        </div>
      )}
    </div>
  );
}
