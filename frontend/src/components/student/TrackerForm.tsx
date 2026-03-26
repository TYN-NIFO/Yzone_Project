import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface TrackerFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrackerForm({ onClose, onSuccess }: TrackerFormProps) {
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    tasksCompleted: '',
    learningSummary: '',
    hoursSpent: '',
    challenges: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('entryDate', formData.entryDate);
      formDataToSend.append('tasksCompleted', formData.tasksCompleted);
      formDataToSend.append('learningSummary', formData.learningSummary);
      formDataToSend.append('hoursSpent', formData.hoursSpent);
      formDataToSend.append('challenges', formData.challenges);
      
      if (file) {
        formDataToSend.append('file', file);
      }

      const response = await fetch('http://localhost:5000/api/student/tracker', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to submit tracker');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit tracker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Submit Daily Tracker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.entryDate}
              onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasks Completed *
            </label>
            <textarea
              required
              value={formData.tasksCompleted}
              onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
              rows={3}
              placeholder="List the tasks you completed today..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Summary *
            </label>
            <textarea
              required
              value={formData.learningSummary}
              onChange={(e) => setFormData({ ...formData, learningSummary: e.target.value })}
              rows={3}
              placeholder="What did you learn today?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours Spent *
            </label>
            <input
              type="number"
              required
              min="0"
              max="24"
              step="0.5"
              value={formData.hoursSpent}
              onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challenges Faced
            </label>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              rows={2}
              placeholder="Any challenges or blockers?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof/Screenshot (Optional)
            </label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload size={20} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Choose file or drag here'}
                </span>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept="image/*,.pdf"
                  className="hidden"
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Tracker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
