import React, { useState } from 'react';
import { useStaff, useFilteredStaff, useStaffMutation } from '../hooks/useStaff';
import { StaffCard } from '../components/StaffCard';
import { Staff, StaffRole, StaffStatus } from '../types';
import { Search, Filter, Plus, X, User } from 'lucide-react';

const roleOptions: { value: StaffRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'manager', label: 'Manager' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'server', label: 'Server' },
  { value: 'host', label: 'Host' },
  { value: 'cook', label: 'Cook' },
  { value: 'busser', label: 'Busser' },
  { value: 'security', label: 'Security' },
];

const statusOptions: { value: StaffStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
];

export function StaffList() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);

  const { data: staff, loading, error, refetch } = useFilteredStaff({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const { create, update, remove, loading: mutationLoading } = useStaffMutation();

  const handleAddStaff = async (data: Omit<Staff, 'id'>) => {
    try {
      await create(data);
      setShowAddModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to add staff:', err);
    }
  };

  const handleUpdateStaff = async (id: string, data: Partial<Staff>) => {
    try {
      await update(id, data);
      setEditingStaff(null);
      refetch();
    } catch (err) {
      console.error('Failed to update staff:', err);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await remove(id);
        refetch();
      } catch (err) {
        console.error('Failed to delete staff:', err);
      }
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
        <p className="text-red-500">Failed to load staff data</p>
        <button onClick={refetch} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as StaffRole | '')}
                className="select pl-9 pr-8"
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StaffStatus | '')}
              className="select"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {staff && staff.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No staff members found</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
            Add Your First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff?.map(member => (
            <StaffCard
              key={member.id}
              staff={member}
              onEdit={setEditingStaff}
              onView={setViewingStaff}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <StaffModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStaff}
          loading={mutationLoading}
        />
      )}

      {editingStaff && (
        <StaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSubmit={(data) => handleUpdateStaff(editingStaff.id, data)}
          onDelete={() => handleDeleteStaff(editingStaff.id)}
          loading={mutationLoading}
        />
      )}

      {viewingStaff && (
        <StaffModal
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onSubmit={() => {}}
          viewOnly
        />
      )}
    </div>
  );
}

interface StaffModalProps {
  staff?: Staff;
  onClose: () => void;
  onSubmit: (data: Omit<Staff, 'id'> | Partial<Staff>) => void;
  onDelete?: () => void;
  loading?: boolean;
  viewOnly?: boolean;
}

function StaffModal({ staff, onClose, onSubmit, onDelete, loading, viewOnly }: StaffModalProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'server' as StaffRole,
    status: staff?.status || 'active' as StaffStatus,
    department: staff?.department || '',
    hourlyRate: staff?.hourlyRate || 15,
    hireDate: staff?.hireDate || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staff) {
      onSubmit(formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewOnly ? 'Staff Details' : staff ? 'Edit Staff' : 'Add New Staff'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
                disabled={viewOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
                disabled={viewOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                required
                disabled={viewOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                  className="select"
                  disabled={viewOnly}
                >
                  {roleOptions.filter(o => o.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                  className="select"
                  disabled={viewOnly}
                >
                  {statusOptions.filter(o => o.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
                disabled={viewOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  className="input"
                  min="0"
                  step="0.5"
                  disabled={viewOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="input"
                  disabled={viewOnly}
                />
              </div>
            </div>

            {!viewOnly && (
              <div className="flex gap-3 pt-4">
                {staff && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Saving...' : staff ? 'Update' : 'Add Staff'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
