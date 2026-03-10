import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Activity,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import ReviewForm from '../../components/mentor/ReviewForm';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading mentor dashboard...');
      const response = await dashboardService.getMentorDashboard();
      console.log('✅ Dashboard response:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', response ? Object.keys(response) : 'null');
      
      // The response from dashboardService.getMentorDashboard() is already the data object
      // It returns response.data from the API, which is { stats, students }
      if (response) {
        setDashboardData(response);
        console.log('✅ Dashboard data set:', response);
      } else {
        console.error('❌ Invalid response structure:', response);
        setDashboardData({ stats: {}, students: [] });
      }
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      // Set empty data on error so UI doesn't break
      setDashboardData({ stats: {}, students: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReview = (student: any) => {
    setSelectedStudent(student);
    setShowReviewForm(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
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
  const students = dashboardData?.students || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Industry Mentor Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard
            title="Active Students"
            value={stats.activeStudents || 0}
            icon={<Activity size={24} />}
            color="emerald"
          />
          <StatCard
            title="Average Score"
            value={stats.avgScore ? Number(stats.avgScore).toFixed(1) : 'N/A'}
            icon={<TrendingUp size={24} />}
            color="violet"
          />
        </div>

        {/* Assigned Students */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Assigned Students</h3>
          
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No students assigned yet</p>
              <p className="text-sm text-gray-500">
                Contact your facilitator to assign students to your mentorship
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Trackers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.cohort_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.recent_trackers || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.score ? Number(student.score).toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.rank || '-'}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleReview(student)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <MessageSquare size={16} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showReviewForm && selectedStudent && (
        <ReviewForm
          student={selectedStudent}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedStudent(null);
          }}
          onSuccess={handleReviewSuccess}
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
