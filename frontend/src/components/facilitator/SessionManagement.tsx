import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Trash2, X, UserCheck } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  session_date: string;
  total_students: number;
  total_marked: number;
  present_count: number;
  created_at: string;
}

interface SessionManagementProps {
  cohortId: string;
  cohortName: string;
}

export default function SessionManagement({ cohortId, cohortName }: SessionManagementProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    sessionDate: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (cohortId) {
      loadSessions();
    }
  }, [cohortId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/sessions/${cohortId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.sessionDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/facilitator/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cohortId,
          title: formData.title,
          sessionDate: formData.sessionDate,
          description: formData.description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Session created successfully!');
        setFormData({
          title: '',
          sessionDate: new Date().toISOString().split('T')[0],
          description: ''
        });
        setShowCreateForm(false);
        loadSessions();
      } else {
        alert(result.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This will also delete all attendance records.')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Session deleted successfully');
        loadSessions();
      } else {
        alert(result.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const getAttendancePercentage = (session: Session) => {
    if (session.total_students === 0) return 0;
    return Math.round((session.present_count / session.total_students) * 100);
  };

  const handleMarkAttendance = async (session: Session) => {
    setSelectedSession(session);
    setShowAttendanceModal(true);
    
    // Load students for this session
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/session-students/${session.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
        // Initialize attendance state
        const initialAttendance: Record<string, boolean> = {};
        result.data.forEach((student: any) => {
          initialAttendance[student.id] = student.is_present || false;
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSession) return;

    try {
      setMarkingAttendance(true);
      const token = sessionStorage.getItem('token');
      
      const attendanceData = Object.entries(attendance).map(([studentId, isPresent]) => ({
        studentId,
        isPresent
      }));

      const response = await fetch('/api/facilitator/mark-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          attendance: attendanceData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Attendance marked successfully!');
        setShowAttendanceModal(false);
        setSelectedSession(null);
        loadSessions(); // Refresh sessions to show updated attendance
      } else {
        alert(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
          <p className="text-sm text-gray-600 mt-1">Cohort: {cohortName}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Create Session
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Session</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to React"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Date *
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Session description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Sessions</h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No sessions created yet</p>
              <p className="text-sm text-gray-400">Click "Create Session" to add your first session</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{session.title}</h4>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{session.total_students} students</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            {session.total_marked > 0 
                              ? `${session.total_marked} marked`
                              : 'Not marked yet'}
                          </span>
                        </div>
                      </div>

                      {session.total_marked > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Attendance</span>
                            <span className="font-medium text-gray-900">
                              {getAttendancePercentage(session)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${getAttendancePercentage(session)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.present_count} present out of {session.total_students}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleMarkAttendance(session)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark attendance"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Marking Modal */}
      {showAttendanceModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedSession.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedSession.session_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAttendanceModal(false);
                  setSelectedSession(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {Object.values(attendance).filter(Boolean).length} of {students.length} marked present
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allPresent: Record<string, boolean> = {};
                      students.forEach(s => allPresent[s.id] = true);
                      setAttendance(allPresent);
                    }}
                    className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => {
                      const allAbsent: Record<string, boolean> = {};
                      students.forEach(s => allAbsent[s.id] = false);
                      setAttendance(allAbsent);
                    }}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        attendance[student.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {attendance[student.id] ? 'Present' : 'Absent'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={markingAttendance}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAttendance ? 'Saving...' : 'Save Attendance'}
                </button>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false);
                    setSelectedSession(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
