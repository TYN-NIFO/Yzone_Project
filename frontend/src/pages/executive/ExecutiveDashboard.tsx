import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  GraduationCap, 
  TrendingUp, 
  Activity,
  UserPlus,
  LogOut,
<<<<<<< HEAD
  Plus
=======
  Plus,
  FileText
>>>>>>> e25b0f6 (hi)
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import TenantForm from '../../components/executive/TenantForm';
import CohortForm from '../../components/executive/CohortForm';
<<<<<<< HEAD
=======
import { MOUUpload } from '../../components/executive/MOUUpload';
>>>>>>> e25b0f6 (hi)

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showCohortForm, setShowCohortForm] = useState(false);
<<<<<<< HEAD
=======
  const [activeTab, setActiveTab] = useState('dashboard');
>>>>>>> e25b0f6 (hi)

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getExecutiveDashboard();
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

  const stats = dashboardData?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tyn Executive Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTenantForm(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <Plus size={18} />
                New Tenant
              </button>
              <button
                onClick={() => setShowCohortForm(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus size={18} />
                New Cohort
              </button>
              <button
                onClick={() => navigate('/executive/users')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                Manage Users
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
<<<<<<< HEAD
=======
          
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
                onClick={() => setActiveTab('mou')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mou'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                MOU Management
              </button>
            </nav>
          </div>
>>>>>>> e25b0f6 (hi)
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
<<<<<<< HEAD
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tenants"
            value={stats.total_tenants || 0}
            icon={<Building2 size={24} />}
            color="blue"
          />
          <StatCard
            title="Total Cohorts"
            value={stats.total_cohorts || 0}
            icon={<GraduationCap size={24} />}
            color="violet"
          />
          <StatCard
            title="Total Students"
            value={stats.total_students || 0}
            icon={<Users size={24} />}
            color="emerald"
          />
          <StatCard
            title="Tracker Compliance"
            value={`${stats.tracker_compliance || 0}%`}
            icon={<TrendingUp size={24} />}
            color="orange"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Facilitators</h3>
              <Users className="text-violet-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_facilitators || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mentors</h3>
              <Users className="text-blue-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_mentors || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Submissions</h3>
              <Activity className="text-emerald-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.today_submissions || 0}</p>
          </div>
        </div>

        {/* Recent Activity */}
        {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-600">{activity.cohort_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{activity.hours_spent}h</p>
                    <p className="text-xs text-gray-500">{new Date(activity.entry_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cohort Performance */}
        {dashboardData?.cohortPerformance && dashboardData.cohortPerformance.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.cohortPerformance.map((cohort: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cohort.student_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cohort.avg_score ? Number(cohort.avg_score).toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cohort.recent_submissions || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <QuickActionCard
            title="Manage Users"
            description="Create and manage all system users"
            icon={<Users size={24} />}
            onClick={() => navigate('/executive/users')}
          />
          <QuickActionCard
            title="View Reports"
            description="Access detailed analytics and reports"
            icon={<Activity size={24} />}
            onClick={() => alert('Reports coming soon!')}
          />
          <QuickActionCard
            title="System Settings"
            description="Configure system-wide settings"
            icon={<LayoutDashboard size={24} />}
            onClick={() => alert('Settings coming soon!')}
          />
        </div>
=======
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Tenants"
                value={stats.total_tenants || 0}
                icon={<Building2 size={24} />}
                color="blue"
              />
              <StatCard
                title="Total Cohorts"
                value={stats.total_cohorts || 0}
                icon={<GraduationCap size={24} />}
                color="violet"
              />
              <StatCard
                title="Total Students"
                value={stats.total_students || 0}
                icon={<Users size={24} />}
                color="emerald"
              />
              <StatCard
                title="Tracker Compliance"
                value={`${stats.tracker_compliance || 0}%`}
                icon={<TrendingUp size={24} />}
                color="orange"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Facilitators</h3>
                  <Users className="text-violet-600" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total_facilitators || 0}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mentors</h3>
                  <Users className="text-blue-600" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total_mentors || 0}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Submissions</h3>
                  <Activity className="text-emerald-600" size={20} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.today_submissions || 0}</p>
              </div>
            </div>

            {/* Recent Activity */}
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {dashboardData.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-600">{activity.cohort_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{activity.hours_spent}h</p>
                        <p className="text-xs text-gray-500">{new Date(activity.entry_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cohort Performance */}
            {dashboardData?.cohortPerformance && dashboardData.cohortPerformance.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.cohortPerformance.map((cohort: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cohort.student_count || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {cohort.avg_score ? Number(cohort.avg_score).toFixed(1) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cohort.recent_submissions || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <QuickActionCard
                title="Manage Users"
                description="Create and manage all system users"
                icon={<Users size={24} />}
                onClick={() => navigate('/executive/users')}
              />
              <QuickActionCard
                title="View Reports"
                description="Access detailed analytics and reports"
                icon={<Activity size={24} />}
                onClick={() => alert('Reports coming soon!')}
              />
              <QuickActionCard
                title="System Settings"
                description="Configure system-wide settings"
                icon={<LayoutDashboard size={24} />}
                onClick={() => alert('Settings coming soon!')}
              />
            </div>
          </>
        )}

        {activeTab === 'mou' && <MOUUpload />}
>>>>>>> e25b0f6 (hi)
      </main>

      {/* Modals */}
      {showTenantForm && (
        <TenantForm
          onClose={() => setShowTenantForm(false)}
          onSuccess={loadDashboard}
        />
      )}
      {showCohortForm && (
        <CohortForm
          onClose={() => setShowCohortForm(false)}
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

function QuickActionCard({ title, description, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
