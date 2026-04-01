import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Edit, Download } from 'lucide-react';

interface Submission {
  id: string;
  student_name: string;
  student_email: string;
  file_url: string;
  status: string;
  submitted_at: string;
  feedback?: string;
  grade?: number;
  reviewed_at?: string;
}

interface SubmissionManagementProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export default function SubmissionManagement({ projectId, projectTitle, onClose }: SubmissionManagementProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [projectId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/projects/${projectId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'bg-blue-100 text-blue-700',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'NEEDS_REVISION': 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={16} className="text-green-600" />;
      case 'REJECTED': return <XCircle size={16} className="text-red-600" />;
      case 'UNDER_REVIEW': return <Clock size={16} className="text-yellow-600" />;
      case 'NEEDS_REVISION': return <Edit size={16} className="text-orange-600" />;
      default: return <FileText size={16} className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center py-8">Loading submissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Submissions: {projectTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(submission.status)}
                      <div>
                        <p className="font-medium text-gray-900">{submission.student_name}</p>
                        <p className="text-sm text-gray-600">{submission.student_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2 flex-wrap">
                      <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                      {submission.grade !== null && submission.grade !== undefined && (
                        <span className="font-medium text-blue-600">Grade: {submission.grade}/100</span>
                      )}
                      {submission.reviewed_at && (
                        <span className="text-xs text-gray-500">
                          Reviewed: {new Date(submission.reviewed_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {submission.feedback && (
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700 mb-1">Feedback:</p>
                        <p className="text-gray-600">{submission.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!submission.file_url || submission.file_url.includes('storage.example.com')) {
                          e.preventDefault();
                          alert('File not available. Student may need to re-submit.');
                        }
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Download size={14} />
                      View File
                    </a>
                    <button
                      onClick={() => handleReview(submission)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReviewModal && selectedSubmission && (
          <ReviewModal
            submission={selectedSubmission}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedSubmission(null);
            }}
            onSuccess={() => {
              setShowReviewModal(false);
              setSelectedSubmission(null);
              loadSubmissions();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ReviewModalProps {
  submission: Submission;
  onClose: () => void;
  onSuccess: () => void;
}

function ReviewModal({ submission, onClose, onSuccess }: ReviewModalProps) {
  const [status, setStatus] = useState(submission.status);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/facilitator/submissions/${submission.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || null,
          grade: grade ? parseFloat(grade) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Submission reviewed successfully!');
        onSuccess();
      } else {
        alert('Failed to update submission: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Review Submission</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="font-medium">{submission.student_name}</p>
          <p className="text-sm text-gray-600">{submission.student_email}</p>
          <p className="text-sm text-gray-600 mt-1">
            Submitted: {new Date(submission.submitted_at).toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_REVISION">Needs Revision</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade (out of 100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter grade (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide feedback to the student (optional)"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
