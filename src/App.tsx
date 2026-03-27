import DebugConsole from './components/DebugConsole';

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 text-zinc-100">
        <div className="bg-[#0A0A0A] p-8 border border-zinc-800 max-w-md w-full text-center shadow-[0_0_30px_rgba(255,85,0,0.05)]">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#FF5500]">System Error</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-6">
            Supabase configuration missing. Initialize environment variables:
          </p>
          <ul className="text-left text-xs text-zinc-400 bg-[#141414] border border-zinc-800 p-4 mb-6 space-y-2 font-mono">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-xs text-zinc-500 font-serif italic">
            Restart sequence required after configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="group" element={<Group />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="stats" element={<Stats />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="import" element={<Import />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>

      {/* ✅ Debug Console */}
      <DebugConsole />

      {/* ✅ Floating Test Button */}
      <button
        onClick={startFloatingWidget}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff6b00',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          zIndex: 9999,
          cursor: 'pointer'
        }}
      >
        🧪 TEST WIDGET
      </button>
    </>
  );
}
