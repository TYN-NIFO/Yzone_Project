import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';

interface StudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  student?: any; // if provided → edit mode
}

export default function StudentForm({ onClose, onSuccess, student }: StudentFormProps) {
  const isEdit = !!student;
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    password: '',
    phone: student?.phone || '',
    whatsapp_number: student?.whatsapp_number || '',
    cohort_id: student?.cohort_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchCohorts(); }, []);

  const fetchCohorts = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/facilitator/cohorts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) setCohorts(data.data);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEdit
        ? `/api/facilitator/students/${student.id}`
        : '/api/facilitator/students';
      const method = isEdit ? 'PUT' : 'POST';

      const body: any = { ...formData, role: 'student' };
      if (isEdit && !body.password) delete body.password; // don't send empty password on edit

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || data.message || `Failed to ${isEdit ? 'update' : 'create'} student`);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Student' : 'Create New Student'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter student name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="student@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {isEdit ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              required={!isEdit}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
              minLength={isEdit ? 0 : 6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cohort *</label>
            <select
              required
              value={formData.cohort_id}
              onChange={(e) => setFormData({ ...formData, cohort_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} {cohort.cohort_code ? `(${cohort.cohort_code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <PhoneInput
            label="Phone Number"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
          />

          <PhoneInput
            label="WhatsApp Number"
            value={formData.whatsapp_number}
            onChange={(val) => setFormData({ ...formData, whatsapp_number: val })}
          />

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
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
