import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';


interface TenantFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TenantForm({ onClose, onSuccess }: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    institutionCode: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });
const [mouFile, setMouFile] = useState<File | null>(null);
  const [mouTitle, setMouTitle] = useState('');
  const [mouDescription, setMouDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');

      const tenantResponse = await fetch('/api/executive/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      // Safe JSON parse — handle empty responses
      let tenantData: any = {};
      const text = await tenantResponse.text();
      if (text) {
        try { tenantData = JSON.parse(text); } catch { /* ignore */ }
      }

      if (!tenantResponse.ok) {
        setError(tenantData.message || `Error ${tenantResponse.status}: Failed to create tenant`);
        setLoading(false);
        return;
      }

      // If MOU file is provided, upload it
      if (mouFile && mouTitle) {
        const mouFormData = new FormData();
        mouFormData.append('file', mouFile);
        mouFormData.append('title', mouTitle);
        if (mouDescription) mouFormData.append('description', mouDescription);

        await fetch('/api/executive/mou/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: mouFormData,
        }).catch(() => console.error('MOU upload failed, but tenant was created'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create New Tenant</h2>
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

{/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tenant Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution Code *
              </label>
              <input
                type="text"
                required
                value={formData.institutionCode}
                onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* MOU Upload (Optional) */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              MOU Upload (Optional)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MOU Title
              </label>
              <input
                type="text"
                value={mouTitle}
                onChange={(e) => setMouTitle(e.target.value)}
                placeholder="e.g., Partnership Agreement 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MOU Description
              </label>
              <textarea
                value={mouDescription}
                onChange={(e) => setMouDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the MOU..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MOU Document (PDF or Word)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setMouFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {mouFile && (
                <p className="mt-1 text-sm text-gray-600">
                  Selected: {mouFile.name}
                </p>
              )}
            </div>

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
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
