import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Activity,
  CheckCircle,
  Clock,
  LogOut,
  Plus,
  UserCheck,
  LayoutDashboard,
  UserPlus,
  UsersRound
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import CohortForm from '../../components/facilitator/CohortForm';
import TeamForm from '../../components/facilitator/TeamForm';
import ProjectForm from '../../components/facilitator/ProjectForm';
import AttendanceForm from '../../components/facilitator/AttendanceForm';
import StudentForm from '../../components/facilitator/StudentForm';
import MentorForm from '../../components/facilitator/MentorForm';

export default function FacilitatorDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
    if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'teams') {
      loadTeams();
    } else if (activeTab === 'mentors') {
      loadMentors();
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getFacilitatorDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStudents = dashboardData?.students || [];
  const trackerStatus = dashboardData?.trackerStatus || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facilitator Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'students' && (
                <button
                  onClick={() => setShowStudentForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Student
                </button>
              )}
              {activeTab === 'teams' && (
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Team
                </button>
              )}
              {activeTab === 'mentors' && (
                <button
                  onClick={() => setShowMentorForm(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Mentor
                </button>
              )}
              {activeTab === 'dashboard' && (
                <>
                  <button
                    onClick={() => setShowAttendanceForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <UserCheck size={18} />
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    New Project
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        {activeTab === 'dashboard' && (
          <>
            {/* Assigned Cohorts */}
            {cohorts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Your Assigned Cohorts</h3>
                <div className="flex flex-wrap gap-2">
                  {cohorts.map((cohort: any) => (
                    <span key={cohort.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {cohort.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Students"
                value={stats.total_students || 0}
                icon={<Users size={24} />}
                color="blue"
              />
              <StatCard
                title="Today's Submissions"
                value={stats.today_submissions || 0}
                icon={<CheckCircle size={24} />}
                color="emerald"
              />
              <StatCard
                title="Average Score"
                value={stats.avg_score ? Number(stats.avg_score).toFixed(1) : 'N/A'}
                icon={<TrendingUp size={24} />}
                color="violet"
              />
              <StatCard
                title="Total Sessions"
                value={stats.total_sessions || 0}
                icon={<Activity size={24} />}
                color="orange"
              />
            </div>

            {/* Tracker Status */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Tracker Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {trackerStatus.map((student: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                        <td className="px-4 py-3">
                          {student.status === 'submitted' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit">
                              <CheckCircle size={14} />
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1 w-fit">
                              <Clock size={14} />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.submitted_at ? new Date(student.submitted_at).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recent Trackers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardStudents.map((student: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.cohort_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.recent_trackers || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.score ? Number(student.score).toFixed(1) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.rank || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
              <button
                onClick={() => setShowStudentForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                Add Student
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students found. Click "Add Student" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
              <button
                onClick={() => setShowTeamForm(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Create Team
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team: any) => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-gray-900 mb-2">{team.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{team.description || 'No description'}</p>
                  {team.mentor_name && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Assigned Mentor</p>
                      <p className="text-sm font-medium text-purple-700">{team.mentor_name}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Members: {team.member_count || 0}</span>
                    <span className="text-gray-500">Max: {team.max_members || 5}</span>
                  </div>
                </div>
              ))}
            </div>
            {teams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No teams found. Click "Create Team" to add one.
              </div>
            )}
          </div>
        )}

        {activeTab === 'mentors' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Mentor Management</h3>
              <button
                onClick={() => setShowMentorForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <UserPlus size={18} />
                Add Mentor
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mentors.map((mentor: any) => (
                    <tr key={mentor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{mentor.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mentor.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mentor.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mentors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No mentors found. Click "Add Mentor" to create one.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCohortForm && (
        <CohortForm
          onClose={() => setShowCohortForm(false)}
          onSuccess={loadDashboard}
        />
      )}
      {showTeamForm && (
        <TeamForm
          onClose={() => setShowTeamForm(false)}
          onSuccess={() => {
            loadDashboard();
            loadTeams();
          }}
        />
      )}
      {showProjectForm && (
        <ProjectForm
          onClose={() => setShowProjectForm(false)}
          onSuccess={loadDashboard}
        />
      )}
      {showAttendanceForm && (
        <AttendanceForm
          onClose={() => setShowAttendanceForm(false)}
          onSuccess={loadDashboard}
        />
      )}
      {showStudentForm && (
        <StudentForm
          onClose={() => setShowStudentForm(false)}
          onSuccess={() => {
            loadDashboard();
            loadStudents();
          }}
        />
      )}
      {showMentorForm && (
        <MentorForm
          onClose={() => setShowMentorForm(false)}
          onSuccess={() => {
            loadDashboard();
            loadMentors();
          }}
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
