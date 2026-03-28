import React, { useState, useRef } from 'react';
import { Upload, X, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportResult {
  success: any[];
  failed: { row: number; email: string; error: string }[];
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelUserImport({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/users/bulk-import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');
      setResult(data.data);
      if (data.data.success.length > 0) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'name,email,password,role,phone,whatsapp,tenant,cohort,batch,department\n';
    const sample = 'John Doe,john@example.com,Pass@123,student,+911234567890,+911234567890,My College,Batch 2024,2024,Computer Science\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-green-600" />
            Import Users from Excel
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Template download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Download Template</p>
              <p className="text-xs text-blue-700 mt-0.5">Use this template to format your data correctly</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Download size={16} /> Template
            </button>
          </div>

          {/* Columns info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Required columns:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
              <span><span className="font-medium text-red-600">name</span> — full name (required)</span>
              <span><span className="font-medium text-red-600">email</span> — email address (required)</span>
              <span><span className="font-medium text-red-600">password</span> — initial password (required)</span>
              <span><span className="font-medium">role</span> — student / facilitator / etc.</span>
              <span><span className="font-medium">phone</span> — phone number</span>
              <span><span className="font-medium">whatsapp</span> — WhatsApp number</span>
              <span><span className="font-medium">tenant</span> — tenant name (e.g. "My College")</span>
              <span><span className="font-medium">cohort</span> — cohort name (e.g. "Batch 2024")</span>
              <span><span className="font-medium">batch</span> — batch year (students only)</span>
              <span><span className="font-medium">department</span> — department (students only)</span>
            </div>
          </div>

          {/* File upload */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            {file ? (
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Click to upload Excel or CSV</p>
                <p className="text-xs text-gray-500 mt-1">.xlsx, .xls, .csv supported</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle size={20} className="mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.success.length}</p>
                  <p className="text-xs text-green-600">Created</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <AlertCircle size={20} className="mx-auto text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-700">{result.failed.length}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>
              {result.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-800 mb-2">Failed rows:</p>
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-xs text-red-700">Row {f.row} ({f.email}): {f.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Upload size={16} />
                {loading ? 'Importing...' : 'Import Users'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
