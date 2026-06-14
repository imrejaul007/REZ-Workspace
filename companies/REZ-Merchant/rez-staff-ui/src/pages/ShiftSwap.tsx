import React, { useState } from 'react';
import { useSwapRequests, useSwapMutation, useShifts, useStaff } from '../hooks/useStaff';
import { ShiftSwap, ShiftSwap as SwapRequest, SwapStatus } from '../types';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Filter,
  Plus,
  X,
} from 'lucide-react';

const statusConfig: Record<SwapStatus, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  approved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
  cancelled: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelled' },
};

export function ShiftSwapPage() {
  const [statusFilter, setStatusFilter] = useState<SwapStatus | ''>('');
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: swaps, loading, error, refetch } = useSwapRequests();
  const { data: shifts } = useShifts();
  const { data: staff } = useStaff();
  const { approve, reject, create, loading: mutationLoading } = useSwapMutation();

  const filteredSwaps = swaps?.filter(swap =>
    statusFilter === '' || swap.status === statusFilter
  ) || [];

  const pendingCount = swaps?.filter(s => s.status === 'pending').length || 0;

  const handleApprove = async (id: string) => {
    try {
      await approve(id);
      refetch();
    } catch (err) {
      console.error('Failed to approve swap:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reject(id);
      refetch();
    } catch (err) {
      console.error('Failed to reject swap:', err);
    }
  };

  const handleCreateSwap = async (data: Omit<ShiftSwap, 'id' | 'status' | 'createdAt'>) => {
    try {
      await create(data);
      setShowCreateModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to create swap request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load swap requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Swaps</h1>
          <p className="text-gray-500">
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'No pending requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SwapStatus | '')}
              className="select pl-9"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {filteredSwaps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ArrowLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No swap requests found</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4">
            Create Your First Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSwaps.map(swap => (
            <div
              key={swap.id}
              className={`card hover:shadow-md transition-shadow ${
                swap.status === 'pending' ? 'border-yellow-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <ArrowLeftRight className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {swap.requesterName} wants to swap with {swap.targetName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested {format(new Date(swap.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">{swap.requesterName}</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(swap.requesterShiftDate), 'EEE, MMM d')}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">{swap.targetName}</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(swap.targetShiftDate), 'EEE, MMM d')}
                      </p>
                    </div>
                  </div>

                  {swap.reason && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Reason:</span> {swap.reason}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusConfig[swap.status].bg
                    } ${statusConfig[swap.status].color}`}>
                      {statusConfig[swap.status].label}
                    </span>
                    {swap.respondedAt && (
                      <span className="text-xs text-gray-500">
                        Responded {format(new Date(swap.respondedAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                </div>

                {swap.status === 'pending' && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(swap.id)}
                      disabled={mutationLoading}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(swap.id)}
                      disabled={mutationLoading}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && staff && shifts && (
        <CreateSwapModal
          staff={staff}
          shifts={shifts}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSwap}
          loading={mutationLoading}
        />
      )}
    </div>
  );
}

interface CreateSwapModalProps {
  staff: { id: string; name: string }[];
  shifts: { id: string; staffId: string; staffName: string; date: string; startTime: string; endTime: string }[];
  onClose: () => void;
  onSubmit: (data: Omit<ShiftSwap, 'id' | 'status' | 'createdAt'>) => void;
  loading?: boolean;
}

function CreateSwapModal({ staff, shifts, onClose, onSubmit, loading }: CreateSwapModalProps) {
  const [formData, setFormData] = useState({
    requesterId: '',
    requesterName: '',
    requesterShiftId: '',
    requesterShiftDate: '',
    targetId: '',
    targetName: '',
    targetShiftId: '',
    targetShiftDate: '',
    reason: '',
  });

  const handleRequesterChange = (staffId: string) => {
    const selected = staff.find(s => s.id === staffId);
    const staffShifts = shifts.filter(s => s.staffId === staffId);
    setFormData({
      ...formData,
      requesterId: staffId,
      requesterName: selected?.name || '',
      requesterShiftId: staffShifts[0]?.id || '',
      requesterShiftDate: staffShifts[0]?.date || '',
    });
  };

  const handleTargetChange = (staffId: string) => {
    const selected = staff.find(s => s.id === staffId);
    const staffShifts = shifts.filter(s => s.staffId === staffId);
    setFormData({
      ...formData,
      targetId: staffId,
      targetName: selected?.name || '',
      targetShiftId: staffShifts[0]?.id || '',
      targetShiftDate: staffShifts[0]?.date || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const requesterShifts = shifts.filter(s => s.staffId === formData.requesterId);
  const targetShifts = shifts.filter(s => s.staffId === formData.targetId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Swap Request</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requester (You)
              </label>
              <select
                value={formData.requesterId}
                onChange={(e) => handleRequesterChange(e.target.value)}
                className="select"
                required
              >
                <option value="">Select your name</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {requesterShifts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Shift to Swap
                </label>
                <select
                  value={formData.requesterShiftId}
                  onChange={(e) => {
                    const shift = requesterShifts.find(s => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      requesterShiftId: e.target.value,
                      requesterShiftDate: shift?.date || '',
                    });
                  }}
                  className="select"
                  required
                >
                  <option value="">Select your shift</option>
                  {requesterShifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {format(new Date(s.date), 'EEE, MMM d')} - {s.startTime} to {s.endTime}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Swap With (Target)
              </label>
              <select
                value={formData.targetId}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="select"
                required
              >
                <option value="">Select colleague</option>
                {staff.filter(s => s.id !== formData.requesterId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {targetShifts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Their Shift to Swap
                </label>
                <select
                  value={formData.targetShiftId}
                  onChange={(e) => {
                    const shift = targetShifts.find(s => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      targetShiftId: e.target.value,
                      targetShiftDate: shift?.date || '',
                    });
                  }}
                  className="select"
                  required
                >
                  <option value="">Select their shift</option>
                  {targetShifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {format(new Date(s.date), 'EEE, MMM d')} - {s.startTime} to {s.endTime}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input min-h-[80px]"
                placeholder="Why do you need this swap?"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
