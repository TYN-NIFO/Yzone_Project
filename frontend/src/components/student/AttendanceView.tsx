import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  session_title: string;
  session_date: string;
  is_present: boolean;
  marked_at: string;
  marked_by_name: string;
}

interface AttendanceStats {
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  recent_attendance: AttendanceRecord[];
}

export const AttendanceView: React.FC = () => {
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
    fetchUpcomingSessions();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch('/api/student/attendance/stats', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.data) {
        setAttendanceStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const response = await fetch('/api/student/upcoming-sessions', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.data) {
        setUpcomingSessions(data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceIcon = (isPresent: boolean) => {
    return isPresent ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.total_sessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attended</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.attended_sessions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceStats.total_sessions - attendanceStats.attended_sessions}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance %</p>
                <p className={`text-2xl font-bold ${getAttendanceColor(attendanceStats.attendance_percentage)}`}>
                  {attendanceStats.attendance_percentage}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.cohort_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(session.session_date).toLocaleDateString()}
                    </p>
                    {session.attendance_status !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        {getAttendanceIcon(session.attendance_status)}
                        <span className="text-xs text-gray-500">
                          {session.attendance_status ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Attendance History */}
      {attendanceStats?.recent_attendance && attendanceStats.recent_attendance.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceStats.recent_attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.session_title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(record.session_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getAttendanceIcon(record.is_present)}
                          <span className={record.is_present ? 'text-green-700' : 'text-red-700'}>
                            {record.is_present ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.marked_by_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(record.marked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Attendance Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Maintain at least 75% attendance to be eligible for certification</li>
          <li>• Attendance is marked by facilitators during each session</li>
          <li>• Contact your facilitator if you have any attendance discrepancies</li>
          <li>• Regular attendance contributes to your leaderboard score</li>
        </ul>
      </div>
    </div>
  );
};