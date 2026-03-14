import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

type ImportRecord = {
  date: string;
  hours: string;
  duration_minutes: number;
  status?: 'pending' | 'success' | 'error' | 'duplicate';
};

export default function Import() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const parseHours = (hoursStr: string) => {
    const [h, m] = hoursStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data.map((row: any) => ({
            date: row.date,
            hours: row.hours,
            duration_minutes: parseHours(row.hours),
            status: 'pending' as const
          }));
          setRecords(parsed);
          setLoading(false);
        }
      });
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const parsed = json.map((row: any) => ({
            date: row.date,
            hours: row.hours,
            duration_minutes: parseHours(row.hours),
            status: 'pending' as const
          }));
          setRecords(parsed);
        } catch (err) {
          alert('Invalid JSON file');
        }
        setLoading(false);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a CSV or JSON file.');
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!user || records.length === 0) return;
    setImporting(true);

    // Fetch existing sessions to check for duplicates
    const { data: existing } = await supabase
      .from('sessions')
      .select('date')
      .eq('user_id', user.id);
    
    const existingDates = new Set(existing?.map(s => s.date.split('T')[0]));

    const updatedRecords = [...records];
    let successCount = 0;

    for (let i = 0; i < updatedRecords.length; i++) {
      const rec = updatedRecords[i];
      if (existingDates.has(rec.date)) {
        rec.status = 'duplicate';
        continue;
      }

      // Default start time to 12:00 PM
      const startTime = new Date(`${rec.date}T12:00:00`);
      const endTime = new Date(startTime.getTime() + rec.duration_minutes * 60000);

      const { error } = await supabase.from('sessions').insert({
        user_id: user.id,
        date: rec.date,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: rec.duration_minutes,
        // Optional: you might want to link this to a specific "Imported" subject
        // subject_id: null 
      });

      if (error) {
        rec.status = 'error';
      } else {
        rec.status = 'success';
        successCount++;
      }
    }

    setRecords(updatedRecords);
    setImporting(false);
    alert(`Import complete. ${successCount} records imported successfully.`);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Import Data</h1>
        <p className="text-zinc-500 font-serif italic text-sm">Import historical study data from YPT (CSV or JSON).</p>
      </div>

      <div className="bg-[#0A0A0A] p-6 border border-zinc-800 rounded-none">
        <div className="flex items-center justify-center w-full mb-8">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-800 border-dashed rounded-none cursor-pointer bg-[#141414] hover:bg-zinc-900 hover:border-[#FF5500] transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-zinc-500 group-hover:text-[#FF5500] transition-colors" />
              <p className="mb-2 text-sm text-zinc-400 font-mono uppercase tracking-widest"><span className="font-bold text-zinc-100">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">CSV or JSON (date, hours)</p>
            </div>
            <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
          </label>
        </div>

        {records.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100">Preview <span className="text-[#FF5500] font-mono">({records.length})</span></h2>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-[#FF5500] text-black px-6 py-3 font-mono uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Start Import'}
              </button>
            </div>
            
            <div className="overflow-x-auto border border-zinc-800 rounded-none">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#141414] border-b border-zinc-800">
                  <tr>
                    <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Date</th>
                    <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Hours</th>
                    <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Duration (mins)</th>
                    <th className="p-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {records.map((rec, i) => (
                    <tr key={i} className={`hover:bg-[#141414] transition-colors ${rec.status === 'duplicate' ? 'bg-yellow-950/20' : rec.status === 'error' ? 'bg-red-950/20' : ''}`}>
                      <td className="p-4 text-zinc-300 font-mono">{rec.date}</td>
                      <td className="p-4 text-zinc-300 font-mono">{rec.hours}</td>
                      <td className="p-4 text-[#FF5500] font-mono">{rec.duration_minutes}</td>
                      <td className="p-4 font-mono uppercase tracking-widest text-xs">
                        {rec.status === 'pending' && <span className="text-zinc-500">Pending</span>}
                        {rec.status === 'success' && <span className="text-emerald-500 flex items-center gap-2"><CheckCircle size={14}/> Success</span>}
                        {rec.status === 'duplicate' && <span className="text-yellow-500 flex items-center gap-2"><AlertCircle size={14}/> Duplicate</span>}
                        {rec.status === 'error' && <span className="text-red-500 flex items-center gap-2"><AlertCircle size={14}/> Error</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
