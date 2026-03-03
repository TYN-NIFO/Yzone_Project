import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface FeedbackFormProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackForm({ student, onClose, onSuccess }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    academicRating: 0,
    behaviorRating: 0,
    participationRating: 0,
    feedback: '',
    academicComments: '',
    behaviorComments: '',
    recommendations: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.academicRating === 0 || formData.behaviorRating === 0 || formData.participationRating === 0) {
      setError('Please provide all ratings');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/faculty/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to submit feedback');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, label }: any) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label} *</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={`${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 self-center">
          {rating > 0 ? `${rating}/5` : 'Select rating'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Faculty Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">For: {student.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StarRating
              rating={formData.academicRating}
              onRatingChange={(rating: number) => setFormData({ ...formData, academicRating: rating })}
              label="Academic Performance"
            />
            
            <StarRating
              rating={formData.behaviorRating}
              onRatingChange={(rating: number) => setFormData({ ...formData, behaviorRating: rating })}
              label="Behavior & Discipline"
            />
            
            <StarRating
              rating={formData.participationRating}
              onRatingChange={(rating: number) => setFormData({ ...formData, participationRating: rating })}
              label="Class Participation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Feedback *
            </label>
            <textarea
              required
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={4}
              placeholder="Provide overall feedback on the student's performance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Comments
            </label>
            <textarea
              value={formData.academicComments}
              onChange={(e) => setFormData({ ...formData, academicComments: e.target.value })}
              rows={3}
              placeholder="Specific comments about academic performance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Behavior Comments
            </label>
            <textarea
              value={formData.behaviorComments}
              onChange={(e) => setFormData({ ...formData, behaviorComments: e.target.value })}
              rows={3}
              placeholder="Comments about behavior and discipline..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations
            </label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              rows={3}
              placeholder="Recommendations for improvement or further development..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}