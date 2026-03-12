import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use the provided fallback keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yymvdiexrvisjfdxlodp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bXZkaWV4cnZpc2pmZHhsb2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjM4MTEsImV4cCI6MjA4ODg5OTgxMX0.PG4K2l1d4Ja6xBOPaIxfIjCpf6vGuM_6cy4gIen6274';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
};
