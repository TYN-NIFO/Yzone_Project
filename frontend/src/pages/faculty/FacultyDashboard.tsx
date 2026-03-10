import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Activity,
  UserCheck,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import FeedbackForm from '../../components/faculty/FeedbackForm';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading faculty dashboard...');
      const response = await dashboardService.getFacultyDashboard();
      console.log('✅ Faculty dashboard response:', response);
      
      if (response) {
        setDashboardData(response);
        console.log('✅ Faculty dashboard data set:', response);
      } else {
        console.error('❌ Invalid response structure:', response);
        setDashboardData({});
      }
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFeedback = (student: any) => {
    setSelectedStudent(student);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
    setSelectedStudent(null);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const attendanceSummary = dashboardData?.attendanceSummary || [];
  const studentProgress = dashboardData?.studentProgress || [];
  const cohortOverview = dashboardData?.cohortOverview || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Faculty/Principal Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.total_students || 0}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard
            title="Total Cohorts"
            value={stats.total_cohorts || 0}
            icon={<GraduationCap size={24} />}
            color="violet"
          />
          <StatCard
            title="Today's Submissions"
            value={stats.today_submissions || 0}
            icon={<Activity size={24} />}
            color="emerald"
          />
          <StatCard
            title="Average Score"
            value={stats.avg_score ? Number(stats.avg_score).toFixed(1) : 'N/A'}
            icon={<TrendingUp size={24} />}
            color="orange"
          />
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} />
            Attendance Summary by Cohort
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Marked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceSummary.map((cohort: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.cohort_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cohort.present_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cohort.total_marked || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${cohort.attendance_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{cohort.attendance_percentage || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Student Progress</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trackers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentProgress.map((student: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.cohort_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.total_trackers || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.attendance_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.score ? Number(student.score).toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.rank || '-'}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleFeedback(student)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        <MessageSquare size={16} />
                        Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cohort Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facilitator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cohortOverview.map((cohort: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cohort.facilitator_name || 'Not Assigned'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cohort.student_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cohort.avg_score ? Number(cohort.avg_score).toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showFeedbackForm && selectedStudent && (
        <FeedbackForm
          student={selectedStudent}
          onClose={() => {
            setShowFeedbackForm(false);
            setSelectedStudent(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
