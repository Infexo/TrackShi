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
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Import Data</h1>
        <p className="text-gray-500 text-sm">Import historical study data from YPT (CSV or JSON).</p>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-center w-full mb-8">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500">CSV or JSON (date, hours)</p>
            </div>
            <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
          </label>
        </div>

        {records.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Preview ({records.length} records)</h2>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Start Import'}
              </button>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Date</th>
                    <th className="p-3 font-semibold text-gray-600">Hours</th>
                    <th className="p-3 font-semibold text-gray-600">Duration (mins)</th>
                    <th className="p-3 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec, i) => (
                    <tr key={i} className={rec.status === 'duplicate' ? 'bg-yellow-50' : rec.status === 'error' ? 'bg-red-50' : ''}>
                      <td className="p-3">{rec.date}</td>
                      <td className="p-3">{rec.hours}</td>
                      <td className="p-3">{rec.duration_minutes}</td>
                      <td className="p-3">
                        {rec.status === 'pending' && <span className="text-gray-500">Pending</span>}
                        {rec.status === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Success</span>}
                        {rec.status === 'duplicate' && <span className="text-yellow-600 flex items-center gap-1"><AlertCircle size={14}/> Duplicate</span>}
                        {rec.status === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Error</span>}
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
