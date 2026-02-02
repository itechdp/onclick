import { useState, useEffect } from 'react';
import { Lightbulb, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { featureRequestService, FeatureRequest, UpdateFeatureRequestData } from '../services/featureRequestService';

export function FeatureRequestsManager() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateFeatureRequestData>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await featureRequestService.getAllFeatureRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading feature requests:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: FeatureRequest) => {
    setEditingId(request.id);
    setEditData({
      status: request.status,
      priority: request.priority,
      adminNotes: request.adminNotes || ''
    });
  };

  const handleSave = async (id: string) => {
    try {
      await featureRequestService.updateFeatureRequest(id, editData);
      toast.success('Feature request updated');
      setEditingId(null);
      loadRequests();
    } catch (error) {
      console.error('Error updating feature request:', error);
      toast.error('Failed to update feature request');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature request?')) {
      return;
    }

    try {
      await featureRequestService.deleteFeatureRequest(id);
      toast.success('Feature request deleted');
      loadRequests();
    } catch (error) {
      console.error('Error deleting feature request:', error);
      toast.error('Failed to delete feature request');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      planned: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Feature Requests</h2>
        <span className="ml-auto text-sm text-gray-600">
          {requests.length} total requests
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No feature requests yet</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === request.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={editData.adminNotes}
                      onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add notes for the user..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(request.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{request.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>By: {request.userName} ({request.userEmail})</span>
                        <span>•</span>
                        <span>{request.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleEdit(request)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{request.adminNotes}</p>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      Priority: {request.priority.toUpperCase()}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
