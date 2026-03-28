import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity,
  Bell,
  Trophy,
  Calendar,
  LogOut,
  Plus,
  LayoutDashboard,
  CheckCircle,
  Edit3,
  FolderKanban,
  Upload,
  X
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import TrackerForm from '../../components/student/TrackerForm';
import { AttendanceView } from '../../components/student/AttendanceView';
import { TrackerModification } from '../../components/student/TrackerModification';
import ProjectSubmitModal from '../../components/student/ProjectSubmitModal';


export default function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showTrackerForm, setShowTrackerForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEditTracker, setShowEditTracker] = useState(false);
  const [submittingProject, setSubmittingProject] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading student dashboard...');
      const response = await dashboardService.getStudentDashboard();
      console.log('✅ Student dashboard response:', response);
      
      if (response) {
        setDashboardData(response);
        console.log('✅ Student dashboard data set:', response);
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
  const facultyFeedback = dashboardData?.facultyFeedback || [];
  const topLeaderboard = dashboardData?.topLeaderboard || [];
  const projects = dashboardData?.projects || [];

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
                onClick={() => setActiveTab('tracker-edit')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Tracker
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-gray-600" />
                  {notifications.filter((n: any) => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {notifications.filter((n: any) => !n.is_read).length > 9 ? '9+' : notifications.filter((n: any) => !n.is_read).length}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                        {notifications.filter((n: any) => !n.is_read).length > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                            {notifications.filter((n: any) => !n.is_read).length} new
                          </span>
                        )}
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={28} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif: any, index: number) => (
                          <div
                            key={index}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                              !notif.is_read ? 'bg-blue-50/60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
{/* Navigation Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                My Attendance
              </button>
              <button
                onClick={() => setActiveTab('tracker-edit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracker-edit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Edit Today's Tracker
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FolderKanban className="w-4 h-4 inline mr-2" />
                My Projects
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
{activeTab === 'dashboard' && (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
              {/* Recent Trackers */}
              <div className="bg-white rounded-lg shadow-sm p-6">
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
                    <p className="text-center text-gray-500 py-8">No mentor feedback yet</p>
                  )}
                </div>
              </div>

              {/* Faculty Feedback */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Feedback</h3>
                <div className="space-y-4">
                  {facultyFeedback.map((feedback: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{feedback.faculty_name}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Academic: {feedback.academic_rating}/5</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Behavior: {feedback.behavior_rating}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{feedback.feedback}</p>
                      {feedback.recommendations && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Recommendations:</span> {feedback.recommendations}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{new Date(feedback.feedback_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {facultyFeedback.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No faculty feedback yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
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
          </>
        )}

        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'tracker-edit' && <TrackerModification />}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Projects</h3>
              
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No projects assigned yet</p>
                  <p className="text-sm text-gray-400 mt-1">Your facilitator will assign projects soon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project: any) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{project.title}</h4>
                          {project.team_name && (
                            <p className="text-sm text-gray-600 mb-2">
                              Team: <span className="font-medium text-blue-600">{project.team_name}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {project.type && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {project.type}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            project.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {project.start_date && (
                          <p>Start: {new Date(project.start_date).toLocaleDateString()}</p>
                        )}
                        {project.end_date && (
                          <p>Due: {new Date(project.end_date).toLocaleDateString()}</p>
                        )}
                      </div>

                      {/* Submission Status */}
                      {project.submission_id ? (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Submission Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              project.submission_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              project.submission_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              project.submission_status === 'NEEDS_REVISION' ? 'bg-orange-100 text-orange-700' :
                              project.submission_status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {project.submission_status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {project.submitted_at && (
                            <p className="text-xs text-gray-500 mb-2">
                              Submitted: {new Date(project.submitted_at).toLocaleString()}
                            </p>
                          )}

                          {project.grade !== null && project.grade !== undefined && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Grade: </span>
                              <span className="text-lg font-bold text-blue-600">{project.grade}/100</span>
                            </div>
                          )}

                          {project.feedback && (
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                              <p className="text-xs font-medium text-gray-700 mb-1">Facilitator Feedback:</p>
                              <p className="text-sm text-gray-600">{project.feedback}</p>
                            </div>
                          )}

                          {project.reviewed_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Reviewed: {new Date(project.reviewed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSubmittingProject(project)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Upload size={16} />
                          Submit Project
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {showTrackerForm && (
        <TrackerForm
          onClose={() => setShowTrackerForm(false)}
          onSuccess={loadDashboard}
        />
      )}
      {submittingProject && (
        <ProjectSubmitModal
          project={submittingProject}
          onClose={() => setSubmittingProject(null)}
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
