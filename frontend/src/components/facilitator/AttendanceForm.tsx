import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar } from 'lucide-react';

interface AttendanceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AttendanceForm({ onClose, onSuccess }: AttendanceFormProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendance, setAttendance] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodaySessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionStudents(selectedSession);
    }
  }, [selectedSession]);

  const loadTodaySessions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/facilitator/today-sessions', {
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

  const loadSessionStudents = async (sessionId: string) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/session-students/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        // Initialize attendance state
        const initialAttendance: {[key: string]: boolean} = {};
        data.data.forEach((student: any) => {
          initialAttendance[student.id] = student.is_present || false;
        });
        setAttendance(initialAttendance);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
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
      const attendanceData = Object.entries(attendance).map(([studentId, isPresent]) => ({
        studentId,
        isPresent
      }));

      const response = await fetch('/api/facilitator/mark-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          attendance: attendanceData,
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

  const markAllPresent = () => {
    const allPresent: {[key: string]: boolean} = {};
    students.forEach(student => {
      allPresent[student.id] = true;
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: {[key: string]: boolean} = {};
    students.forEach(student => {
      allAbsent[student.id] = false;
    });
    setAttendance(allAbsent);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <UserCheck className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
          </div>
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
              Select Session *
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
                    {session.title} - {session.session_date}
                  </option>
                ))}
              </select>
            )}
          </div>

          {students.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Students ({students.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={markAllPresent}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={markAllAbsent}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    All Absent
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendance[student.id] === true}
                          onChange={() => handleAttendanceChange(student.id, true)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-green-700">Present</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendance[student.id] === false}
                          onChange={() => handleAttendanceChange(student.id, false)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-red-700">Absent</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
              disabled={loading || sessions.length === 0 || students.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}