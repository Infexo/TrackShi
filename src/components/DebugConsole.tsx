// src/components/DebugConsole.tsx

import React, { useState, useEffect } from 'react';

// Global log array that any file can push to
(window as any).__DEBUG_LOGS = (window as any).__DEBUG_LOGS || [];

export const debugLog = (msg: string) => {
  const entry = `${new Date().toLocaleTimeString()}: ${msg}`;
  console.log(entry);
  (window as any).__DEBUG_LOGS.push(entry);
  // Trigger re-render via custom event
  window.dispatchEvent(new CustomEvent('debug-log'));
};

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = () => {
      setLogs([...(window as any).__DEBUG_LOGS]);
    };
    window.addEventListener('debug-log', handler);
    return () => window.removeEventListener('debug-log', handler);
  }, []);

  if (!visible) {
    return (
      <div
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed', bottom: 10, right: 10,
          background: 'red', color: 'white',
          padding: '8px 12px', borderRadius: '50%',
          zIndex: 999999, fontSize: '14px', fontWeight: 'bold'
        }}
      >
        🐛
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(0,0,0,0.95)', color: '#00ff00',
      fontSize: '11px', padding: '8px',
      maxHeight: '200px', overflowY: 'auto',
      zIndex: 999999, fontFamily: 'monospace',
      borderTop: '2px solid #00ff00'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: '#ff0', fontWeight: 'bold' }}>🐛 DEBUG CONSOLE</span>
        <span onClick={() => setVisible(false)} style={{ cursor: 'pointer', color: 'red' }}>✕</span>
      </div>
      {logs.length === 0 && <div style={{ color: '#666' }}>No logs yet...</div>}
      {logs.map((log, i) => (
        <div key={i} style={{ borderBottom: '1px solid #333', padding: '2px 0' }}>{log}</div>
      ))}
    </div>
  );
};

export default DebugConsole;
