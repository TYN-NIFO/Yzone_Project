import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface ReviewFormProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ student, onClose, onSuccess }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: '',
    strengths: '',
    improvements: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('📝 Submitting review for student:', student.id);
      console.log('📝 Token exists:', !!token);
      
      const response = await fetch('/api/mentor/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          rating: formData.rating,
          feedback: formData.feedback,
          strengths: formData.strengths,
          improvements: formData.improvements,
        }),
      });

      console.log('📝 Review response status:', response.status);
      
      const data = await response.json();
      console.log('📝 Review response data:', data);

      if (response.ok) {
        console.log('✅ Review submitted successfully');
        onSuccess();
        onClose();
      } else {
        console.error('❌ Review submission failed:', data);
        
        // If it's a 401 or 403, suggest re-login
        if (response.status === 401 || response.status === 403) {
          setError(data.message + ' - Please try logging out and logging in again.');
        } else {
          setError(data.message || 'Failed to submit review');
        }
      }
    } catch (err: any) {
      console.error('❌ Review submission error:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit Review</h2>
            <p className="text-sm text-gray-600 mt-1">For: {student.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 self-center">
                {formData.rating > 0 ? `${formData.rating}/5` : 'Select rating'}
              </span>
            </div>
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
              placeholder="Provide your overall feedback on the student's performance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strengths
            </label>
            <textarea
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              rows={3}
              placeholder="What are the student's key strengths?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas for Improvement
            </label>
            <textarea
              value={formData.improvements}
              onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
              rows={3}
              placeholder="What areas should the student focus on improving?"
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
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
