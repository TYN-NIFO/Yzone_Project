import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

interface MOU {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiry_date?: string;
  created_at: string;
  uploaded_by_name: string;
  approved_by_name?: string;
  rejection_reason?: string;
}

interface MOUStats {
  total_mous: number;
  pending_mous: number;
  approved_mous: number;
  rejected_mous: number;
  expired_mous: number;
}

export const MOUUpload: React.FC = () => {
  const [mous, setMous] = useState<MOU[]>([]);
  const [stats, setStats] = useState<MOUStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMOUs();
    fetchStats();
  }, []);

  const fetchMOUs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/executive/mou', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.mous) {
        setMous(data.mous);
      }
    } catch (error) {
      console.error('Error fetching MOUs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/executive/mou/stats', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching MOU stats:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (expiryDate) formData.append('expiry_date', expiryDate);

      const response = await fetch('/api/executive/mou/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        // Reset form
        setTitle('');
        setDescription('');
        setExpiryDate('');
        setFile(null);
        setShowUploadForm(false);
        
        // Refresh data
        fetchMOUs();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload MOU');
      }
    } catch (error) {
      console.error('Error uploading MOU:', error);
      alert('Failed to upload MOU');
    } finally {
      setUploading(false);
    }
  };

  const updateMOUStatus = async (mouId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/executive/mou/${mouId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, rejection_reason: rejectionReason })
      });

      if (response.ok) {
        fetchMOUs();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update MOU status');
      }
    } catch (error) {
      console.error('Error updating MOU status:', error);
      alert('Failed to update MOU status');
    }
  };

  const deleteMOU = async (mouId: string) => {
    if (!confirm('Are you sure you want to delete this MOU?')) return;

    try {
      const response = await fetch(`/api/executive/mou/${mouId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchMOUs();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete MOU');
      }
    } catch (error) {
      console.error('Error deleting MOU:', error);
      alert('Failed to delete MOU');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired': return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total_mous}</div>
            <div className="text-sm text-gray-600">Total MOUs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_mous}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.approved_mous}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.rejected_mous}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{stats.expired_mous}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">MOU Management</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload MOU
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Upload New MOU</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File (PDF or Word) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading || !file || !title}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload MOU'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MOUs List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded MOUs</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading MOUs...</div>
          ) : mous.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No MOUs uploaded yet</div>
          ) : (
            <div className="space-y-4">
              {mous.map((mou) => (
                <div key={mou.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">{mou.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mou.status)}`}>
                          {mou.status.charAt(0).toUpperCase() + mou.status.slice(1)}
                        </span>
                      </div>
                      
                      {mou.description && (
                        <p className="text-gray-600 text-sm mb-2">{mou.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>File: {mou.file_name}</span>
                        <span>Uploaded: {new Date(mou.created_at).toLocaleDateString()}</span>
                        {mou.expiry_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Expires: {new Date(mou.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {mou.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {mou.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(mou.status)}
                      
                      {mou.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateMOUStatus(mou.id, 'approved')}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) updateMOUStatus(mou.id, 'rejected', reason);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => deleteMOU(mou.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <a
                        href={mou.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};