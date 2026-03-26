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
  UsersRound,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import CohortForm from '../../components/facilitator/CohortForm';
import TeamForm from '../../components/facilitator/TeamForm';
import ProjectForm from '../../components/facilitator/ProjectForm';
import AttendanceForm from '../../components/facilitator/AttendanceForm';
import StudentForm from '../../components/facilitator/StudentForm';
import MentorForm from '../../components/facilitator/MentorForm';
import SessionManagement from '../../components/facilitator/SessionManagement';
import SubmissionManagement from '../../components/facilitator/SubmissionManagement';


export default function FacilitatorDashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingMentor, setEditingMentor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showSubmissionManagement, setShowSubmissionManagement] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'teams') {
      loadTeams();
    } else if (activeTab === 'mentors') {
      loadMentors();
    } else if (activeTab === 'projects') {
      loadProjects();
    }
  }, [activeTab, dashboardData]);


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

  const loadStudents = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const cohortId = dashboardData?.cohorts?.[0]?.id;
      if (!cohortId) return;

      const response = await fetch(`/api/facilitator/students/${cohortId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const cohortId = dashboardData?.cohorts?.[0]?.id;
      if (!cohortId) return;

      const response = await fetch(`/api/facilitator/teams/${cohortId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTeams(result.data);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadMentors = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/facilitator/mentors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setMentors(result.data);
      }
    } catch (error) {
      console.error('Failed to load mentors:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const cohortId = dashboardData?.cohorts?.[0]?.id;
      if (!cohortId) return;

      const response = await fetch(`/api/facilitator/projects/cohort/${cohortId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleViewSubmissions = (project: any) => {
    setSelectedProject(project);
    setShowSubmissionManagement(true);
  };

  const handleSendTrackerReminders = async () => {
    try {
      setSendingReminders(true);
      setReminderResult(null);
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/facilitator/send-tracker-reminders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      setReminderResult(result.message || 'Done');
    } catch (error) {
      setReminderResult('Failed to send reminders. Please try again.');
    } finally {
      setSendingReminders(false);
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
  const cohorts = dashboardData?.cohorts || [];
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
                    onClick={handleSendTrackerReminders}
                    disabled={sendingReminders}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-60"
                  >
                    <MessageCircle size={18} />
                    {sendingReminders ? 'Sending...' : 'Send Tracker Reminders'}
                  </button>
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
                onClick={() => setActiveTab('students')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Students
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UsersRound className="w-4 h-4 inline mr-2" />
                Teams
              </button>
              <button
                onClick={() => setActiveTab('mentors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mentors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Mentors
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Sessions
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Projects
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reminder Result Banner */}
        {reminderResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <span className="text-green-800 text-sm">{reminderResult}</span>
            <button onClick={() => setReminderResult(null)} className="text-green-600 hover:text-green-800 text-lg leading-none">&times;</button>
          </div>
        )}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setEditingStudent(student); setShowStudentForm(true); }}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          Edit
                        </button>
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
                  
                  {team.project_title && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Project</p>
                      <p className="text-sm font-medium text-blue-700">{team.project_title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {team.project_type} • Status: {team.project_status}
                      </p>
                    </div>
                  )}
                  
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mentors.map((mentor: any) => (
                    <tr key={mentor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{mentor.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mentor.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mentor.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setEditingMentor(mentor); setShowMentorForm(true); }}
                          className="px-3 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100"
                        >
                          Edit
                        </button>
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

        {activeTab === 'sessions' && cohorts.length > 0 && (
          <SessionManagement 
            cohortId={cohorts[0].id} 
            cohortName={cohorts[0].name}
          />
        )}

        {activeTab === 'sessions' && cohorts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No cohort assigned</p>
              <p className="text-sm text-gray-400 mt-1">You need to be assigned to a cohort to manage sessions</p>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
              <button
                onClick={() => setShowProjectForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Create Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{project.title || project.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'SUBMITTED' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    {project.type && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {project.type}
                      </span>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {project.start_date && (
                      <p>Start: {new Date(project.start_date).toLocaleDateString()}</p>
                    )}
                    {project.end_date && (
                      <p>End: {new Date(project.end_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleViewSubmissions(project)}
                    className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
                  >
                    View Submissions
                  </button>
                </div>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No projects found. Click "Create Project" to add one.
              </div>
            )}
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
          student={editingStudent}
          onClose={() => { setShowStudentForm(false); setEditingStudent(null); }}
          onSuccess={() => { loadDashboard(); loadStudents(); }}
        />
      )}
      {showMentorForm && (
        <MentorForm
          mentor={editingMentor}
          onClose={() => { setShowMentorForm(false); setEditingMentor(null); }}
          onSuccess={() => { loadDashboard(); loadMentors(); }}
        />
      )}

      {showSubmissionManagement && selectedProject && (
        <SubmissionManagement
          projectId={selectedProject.id}
          projectTitle={selectedProject.title || selectedProject.name}
          onClose={() => {
            setShowSubmissionManagement(false);
            setSelectedProject(null);
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
