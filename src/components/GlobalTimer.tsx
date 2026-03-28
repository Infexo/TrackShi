import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import FloatingWidget from '../lib/floatingWidget';
import { Capacitor } from '@capacitor/core';

export default function GlobalTimer() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isStudying, setIsStudying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [subjectName, setSubjectName] = useState<string>('Studying');
  const [hasFloatingPermission, setHasFloatingPermission] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  
  const lastChimeRef = useRef<number>(0);

  useEffect(() => {
    const checkPermission = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { granted } = await FloatingWidget.checkPermission();
          setHasFloatingPermission(granted);
        } catch (e) {
          console.error('Permission check failed', e);
        } finally {
          setPermissionChecked(true);
        }
      } else {
        setPermissionChecked(true);
      }
    };
    checkPermission();
  }, []);

  const handleRequestPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      await FloatingWidget.requestPermission();
      // After returning from settings, check again
      setTimeout(async () => {
        const { granted } = await FloatingWidget.checkPermission();
        setHasFloatingPermission(granted);
      }, 1000);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('live_status')
        .select('*, subjects(name)')
        .eq('user_id', user.id)
        .single();
      
      if (data && data.status === 'studying' && data.started_at) {
        setIsStudying(true);
        setSessionStartTime(new Date(data.started_at));
        if (data.subjects && data.subjects.name) {
          setSubjectName(data.subjects.name);
        }
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
      }, async (payload: any) => {
        const status = payload.new;
        if (status && status.status === 'studying' && status.started_at) {
          setIsStudying(true);
          setSessionStartTime(new Date(status.started_at));
          
          if (status.subject_id) {
            const { data } = await supabase.from('subjects').select('name').eq('id', status.subject_id).single();
            if (data) setSubjectName(data.name);
          }
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

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: number;
    if (isStudying && sessionStartTime) {
      const initialSeconds = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      lastChimeRef.current = Math.floor(initialSeconds / 60);

      if (Capacitor.isNativePlatform() && hasFloatingPermission) {
        FloatingWidget.startWidget({
          timerText: formatTime(initialSeconds),
          subjectName: subjectName
        }).catch(e => console.error('Initial widget start error', e));
      }

      interval = window.setInterval(() => {
        const seconds = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
        setElapsedSeconds(seconds);
        
        document.title = `🔴 LIVE - TrackShi`;

        const minutes = Math.floor(seconds / 60);
        if (minutes > 0 && minutes % 30 === 0 && lastChimeRef.current !== minutes) {
          lastChimeRef.current = minutes;
          playChime();
        }

        // Update floating widget
        if (Capacitor.isNativePlatform() && hasFloatingPermission) {
          try {
            FloatingWidget.startWidget({
              timerText: formatTime(seconds),
              subjectName: subjectName
            });
          } catch (e) {
            console.error('Floating widget error', e);
          }
        }
      }, 1000);
    } else {
      setElapsedSeconds(0);
      document.title = 'TrackShi';
      lastChimeRef.current = 0;
      if (Capacitor.isNativePlatform()) {
        try {
          FloatingWidget.stopWidget();
        } catch (e) {
          // Ignore
        }
      }
    }
    return () => {
      clearInterval(interval);
      document.title = 'TrackShi';
    };
  }, [isStudying, sessionStartTime, subjectName, hasFloatingPermission]);

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

  if (!isStudying) return null;

  return (
    <>
      {permissionChecked && !hasFloatingPermission && Capacitor.isNativePlatform() && (
        <div className="fixed bottom-24 left-6 right-6 z-50 bg-black/95 border-2 border-[#FF5500] p-6 flex flex-col gap-4 shadow-[0_0_30px_rgba(255,85,0,0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></div>
            <p className="font-mono text-sm text-white uppercase tracking-widest font-bold">
              Permission Required
            </p>
          </div>
          <p className="font-mono text-[11px] text-white/80 uppercase tracking-wider leading-relaxed">
            The floating widget needs "Appear on top" permission to work while you use other apps.
          </p>
          <div className="bg-white/5 p-3 border border-white/10">
            <p className="font-mono text-[10px] text-[#FF5500] uppercase tracking-tight font-bold mb-1">
              Samsung Instructions:
            </p>
            <p className="font-mono text-[9px] text-white/60 uppercase tracking-tight">
              Settings &gt; Apps &gt; TrackShi &gt; Appear on top &gt; ON
            </p>
          </div>
          <button
            onClick={handleRequestPermission}
            className="bg-[#FF5500] text-black font-mono font-bold py-3 text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-colors active:scale-95"
          >
            Open Settings
          </button>
        </div>
      )}
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
    </>
  );
}
