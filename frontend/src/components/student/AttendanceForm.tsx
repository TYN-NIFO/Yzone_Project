import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock } from 'lucide-react';

interface AttendanceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AttendanceForm({ onClose, onSuccess }: AttendanceFormProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodaySessions();
    getCurrentLocation();
  }, []);

  const loadTodaySessions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/student/today-sessions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        if (data.data.length === 1) {
          setSelectedSession(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) {
      setError('Please select a session');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/student/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          location: location,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
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
              Today's Sessions *
            </label>
            {sessions.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                No sessions scheduled for today
              </div>
            ) : (
              <select
                required
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} - {new Date(session.start_time).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>Current Time: {new Date().toLocaleTimeString()}</span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <MapPin size={16} />
              <span>Location captured</span>
            </div>
          )}

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
              disabled={loading || sessions.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Marking...' : 'Mark Present'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}