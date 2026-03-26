import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Clock, FileText, MessageSquare, Star } from 'lucide-react';

interface TrackerEntry {
  id: string;
  entry_date: string;
  tasks_completed: string;
  learning_summary: string;
  hours_spent: number;
  challenges?: string;
  proof_file_url?: string;
  submitted_at: string;
  feedback?: {
    id: string;
    feedback: string;
    rating: number;
    suggestions?: string;
    is_approved?: boolean;
    facilitator_name: string;
    created_at: string;
  };
}

export const TrackerModification: React.FC = () => {
  const [todayTracker, setTodayTracker] = useState<TrackerEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [learningSummary, setLearningSummary] = useState('');
  const [hoursSpent, setHoursSpent] = useState(0);
  const [challenges, setChallenges] = useState('');

  useEffect(() => {
    fetchTodayTracker();
  }, []);

  const fetchTodayTracker = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/tracker/today', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.tracker) {
        setTodayTracker(data.tracker);
        // Populate form with existing data
        setTasksCompleted(data.tracker.tasks_completed);
        setLearningSummary(data.tracker.learning_summary);
        setHoursSpent(data.tracker.hours_spent);
        setChallenges(data.tracker.challenges || '');
      }
    } catch (error) {
      console.error('Error fetching today tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (todayTracker) {
      // Reset form to original values
      setTasksCompleted(todayTracker.tasks_completed);
      setLearningSummary(todayTracker.learning_summary);
      setHoursSpent(todayTracker.hours_spent);
      setChallenges(todayTracker.challenges || '');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!todayTracker) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/student/tracker/${todayTracker.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasks_completed: tasksCompleted,
          learning_summary: learningSummary,
          hours_spent: hoursSpent,
          challenges: challenges
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTodayTracker(data.tracker);
        setIsEditing(false);
        alert('Tracker updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update tracker');
      }
    } catch (error) {
      console.error('Error updating tracker:', error);
      alert('Failed to update tracker');
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading today's tracker...</span>
      </div>
    );
  }

  if (!todayTracker) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Tracker Entry for Today</h3>
        <p className="text-yellow-700 mb-4">
          You haven't submitted a tracker entry for today yet. Please submit your daily tracker first.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const canEdit = new Date(todayTracker.entry_date).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Today's Tracker Entry</h2>
          <p className="text-sm text-gray-600">
            Submitted on {new Date(todayTracker.submitted_at).toLocaleString()}
          </p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Entry
          </button>
        )}
      </div>

      {/* Tracker Entry Form/Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Tasks Completed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasks Completed Today *
            </label>
            {isEditing ? (
              <textarea
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what you accomplished today..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{todayTracker.tasks_completed}</p>
              </div>
            )}
          </div>

          {/* Learning Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What Did You Learn Today? *
            </label>
            {isEditing ? (
              <textarea
                value={learningSummary}
                onChange={(e) => setLearningSummary(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Summarize your key learnings..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{todayTracker.learning_summary}</p>
              </div>
            )}
          </div>

          {/* Hours Spent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Spent *
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{todayTracker.hours_spent} hours</p>
              </div>
            )}
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenges Faced (Optional)
            </label>
            {isEditing ? (
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any challenges or blockers you faced..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900">{todayTracker.challenges || 'No challenges mentioned'}</p>
              </div>
            )}
          </div>

          {/* Proof File */}
          {todayTracker.proof_file_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Work
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <a
                  href={todayTracker.proof_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Uploaded File
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !tasksCompleted || !learningSummary || hoursSpent <= 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Facilitator Feedback */}
      {todayTracker.feedback && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Facilitator Feedback
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rating:</span>
                <div className="flex items-center gap-1">
                  {renderStars(todayTracker.feedback.rating)}
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {todayTracker.feedback.rating}/5
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                By {todayTracker.feedback.facilitator_name} • {' '}
                {new Date(todayTracker.feedback.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Feedback:</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {todayTracker.feedback.feedback}
              </p>
            </div>

            {todayTracker.feedback.suggestions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Suggestions:</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                  {todayTracker.feedback.suggestions}
                </p>
              </div>
            )}

            {todayTracker.feedback.is_approved !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  todayTracker.feedback.is_approved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {todayTracker.feedback.is_approved ? 'Approved' : 'Needs Improvement'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modification Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Modification Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You can only modify today's tracker entry</li>
          <li>• Changes must be made before midnight</li>
          <li>• All required fields must be filled</li>
          <li>• Modifications are tracked for audit purposes</li>
          {!canEdit && (
            <li className="text-red-700 font-medium">
              • This entry is from a previous day and cannot be modified
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};