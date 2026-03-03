import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity,
  Bell,
  Trophy,
  Calendar,
  LogOut,
  Plus
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import TrackerForm from '../../components/student/TrackerForm';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showTrackerForm, setShowTrackerForm] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStudentDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const trackerStats = dashboardData?.trackerStats || {};
  const leaderboardRank = dashboardData?.leaderboardRank || {};
  const recentTrackers = dashboardData?.recentTrackers || [];
  const notifications = dashboardData?.notifications || [];
  const mentorFeedback = dashboardData?.mentorFeedback || [];
  const topLeaderboard = dashboardData?.topLeaderboard || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTrackerForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Submit Tracker
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Trackers"
            value={trackerStats.total_entries || 0}
            icon={<Activity size={24} />}
            color="blue"
          />
          <StatCard
            title="This Week"
            value={trackerStats.this_week || 0}
            icon={<Calendar size={24} />}
            color="emerald"
          />
          <StatCard
            title="Your Score"
            value={leaderboardRank.total_score ? Number(leaderboardRank.total_score).toFixed(1) : '0'}
            icon={<TrendingUp size={24} />}
            color="violet"
          />
          <StatCard
            title="Your Rank"
            value={leaderboardRank.rank || '-'}
            icon={<Trophy size={24} />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Trackers */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tracker Submissions</h3>
            <div className="space-y-3">
              {recentTrackers.slice(0, 7).map((tracker: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{new Date(tracker.entry_date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-1">{tracker.learning_summary}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">{tracker.hours_spent}h</p>
                    <p className="text-xs text-gray-500">{tracker.tasks_completed} tasks</p>
                  </div>
                </div>
              ))}
              {recentTrackers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No tracker submissions yet</p>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="text-blue-600" size={20} />
              Notifications
            </h3>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg ${notif.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No notifications</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mentor Feedback */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentor Feedback</h3>
            <div className="space-y-4">
              {mentorFeedback.map((feedback: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{feedback.mentor_name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">{feedback.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{feedback.feedback}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(feedback.review_date).toLocaleDateString()}</p>
                </div>
              ))}
              {mentorFeedback.length === 0 && (
                <p className="text-center text-gray-500 py-8">No feedback yet</p>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              Top Performers
            </h3>
            <div className="space-y-2">
              {topLeaderboard.map((student: any, index: number) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    student.student_id === currentUser?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${index < 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      #{student.rank}
                    </span>
                    <p className="font-medium text-gray-900">{student.student_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {Number(student.total_score).toFixed(1)}
                  </span>
                </div>
              ))}
              {topLeaderboard.length === 0 && (
                <p className="text-center text-gray-500 py-8">No leaderboard data</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showTrackerForm && (
        <TrackerForm
          onClose={() => setShowTrackerForm(false)}
          onSuccess={loadDashboard}
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
