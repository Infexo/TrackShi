import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function GlobalTimer() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isStudying, setIsStudying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const lastChimeRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('live_status')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && data.status === 'studying' && data.started_at) {
        setIsStudying(true);
        setSessionStartTime(new Date(data.started_at));
      } else {
        setIsStudying(false);
        setSessionStartTime(null);
      }
    };

    fetchStatus();

    const channel = supabase
      .channel(`global_timer_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'live_status',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        const status = payload.new;
        if (status && status.status === 'studying' && status.started_at) {
          setIsStudying(true);
          setSessionStartTime(new Date(status.started_at));
        } else {
          setIsStudying(false);
          setSessionStartTime(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    let interval: number;
    if (isStudying && sessionStartTime) {
      // Initialize lastChimeRef to current minutes so it doesn't chime immediately on load
      const initialSeconds = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      lastChimeRef.current = Math.floor(initialSeconds / 60);

      interval = window.setInterval(() => {
        const seconds = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
        setElapsedSeconds(seconds);
        
        // Update Tab Title
        document.title = `🔴 LIVE - TrackShi`;

        // Play chime every 30 minutes (1800 seconds)
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0 && minutes % 30 === 0 && lastChimeRef.current !== minutes) {
          lastChimeRef.current = minutes;
          playChime();
        }
      }, 1000);
    } else {
      setElapsedSeconds(0);
      document.title = 'TrackShi';
      lastChimeRef.current = 0;
    }
    return () => {
      clearInterval(interval);
      document.title = 'TrackShi';
    };
  }, [isStudying, sessionStartTime]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.5); // C6

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isStudying) return null;

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed bottom-6 right-6 z-50 bg-[#FF5500] text-black px-4 py-3 rounded-none shadow-[0_0_20px_rgba(255,85,0,0.4)] flex items-center gap-3 hover:bg-orange-600 transition-all border border-[#FF5500] group"
    >
      <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
      <span className="font-mono font-bold uppercase tracking-widest text-sm">
        {formatTime(elapsedSeconds)}
      </span>
      <span className="font-mono font-bold uppercase tracking-widest text-xs opacity-70 group-hover:opacity-100">
        BACK
      </span>
    </button>
  );
}
