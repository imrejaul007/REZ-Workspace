'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserCog,
  HeadphonesIcon,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import DataTable, { Pagination } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import SearchInput, { SelectInput } from '@/components/ui/Input';
import StatsCard from '@/components/ui/StatsCard';
import {
  getUsers,
  getUserStats,
  createUser,
  updateUser,
  deleteUser,
  getTenants,
} from '@/lib/api';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { PlatformUser, UserStats, Tenant } from '@/types';

const ROLE_ICONS = {
  super_admin: Shield,
  admin: UserCog,
  support: HeadphonesIcon,
};

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-600',
  admin: 'bg-blue-100 text-blue-600',
  support: 'bg-green-100 text-green-600',
};

export default function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; user: PlatformUser | null }>({
    open: false,
    user: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, statsData, tenantsData] = await Promise.all([
        getUsers({
          page,
          limit: 10,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }),
        getUserStats(),
        getTenants({ limit: 100 }),
      ]);
      setUsers(usersData.data);
      setStats(statsData);
      setTenants(tenantsData.data);
      setTotalPages(usersData.totalPages);
      setTotalItems(usersData.total);
    } catch (error) {
      logger.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async (data: {
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'support';
    tenantId?: string;
    tenantName?: string;
    permissions: string[];
  }) => {
    setActionLoading(true);
    try {
      await createUser(data);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      logger.error('Failed to create user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (id: string, data: Partial<PlatformUser>) => {
    setActionLoading(true);
    try {
      await updateUser(id, data);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      logger.error('Failed to update user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete.user) return;
    setActionLoading(true);
    try {
      await deleteUser(confirmDelete.user.id);
      setConfirmDelete({ open: false, user: null });
      fetchData();
    } catch (error) {
      logger.error('Failed to delete user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (user: PlatformUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: PlatformUser) => {
        const Icon = ROLE_ICONS[user.role];
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                ROLE_COLORS[user.role]
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {user.role.replace('_', ' ')}
            </span>
          </div>
        );
      },
    },
    {
      key: 'tenant',
      header: 'Tenant',
      render: (user: PlatformUser) => (
        <span className="text-gray-600">
          {user.tenantName || 'Platform Level'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: PlatformUser) => <StatusBadge status={user.status} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: PlatformUser) => (
        <span className="text-gray-500">
          {user.lastLogin ? getRelativeTime(user.lastLogin) : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user: PlatformUser) => (
        <span className="text-gray-500">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (user: PlatformUser) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setShowDetailModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setShowEditModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Fragment>
      <DashboardWrapper
        title="Users"
        subtitle={`${stats?.total || 0} platform users`}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Users"
            value={stats?.total || 0}
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            title="Super Admins"
            value={stats?.byRole.super_admin || 0}
            icon={<Shield className="w-5 h-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Admins"
            value={stats?.byRole.admin || 0}
            icon={<UserCog className="w-5 h-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Support"
            value={stats?.byRole.support || 0}
            icon={<HeadphonesIcon className="w-5 h-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />
          </div>
          <SelectInput
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'admin', label: 'Admin' },
              { value: 'support', label: 'Support' },
            ]}
            placeholder="All Roles"
          />
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]}
            placeholder="All Status"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          loading={loading}
          emptyMessage="No users found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            tenants={tenants}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateUser}
            loading={actionLoading}
          />
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            tenants={tenants}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSubmit={(data) => handleUpdateUser(selectedUser.id, data)}
            loading={actionLoading}
          />
        )}

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedUser(null);
            }}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => {
              setConfirmDelete({ open: true, user: selectedUser });
            }}
          />
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, user: null })}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete "${confirmDelete.user?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={actionLoading}
        />
      </Fragment>
    </Fragment>
  );
}

// Create User Modal Component
function CreateUserModal({
  tenants,
  onClose,
  onSubmit,
  loading,
}: {
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'support';
    tenantId?: string;
    tenantName?: string;
    permissions: string[];
  }) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin' as 'super_admin' | 'admin' | 'support',
    tenantId: '',
    permissions: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === formData.tenantId);
    onSubmit({
      ...formData,
      tenantId: formData.tenantId || undefined,
      tenantName: tenant?.name,
    });
  };

  const availablePermissions = [
    { id: 'tenants:read', label: 'View Tenants' },
    { id: 'tenants:write', label: 'Manage Tenants' },
    { id: 'users:read', label: 'View Users' },
    { id: 'users:write', label: 'Manage Users' },
    { id: 'billing:read', label: 'View Billing' },
    { id: 'billing:write', label: 'Manage Billing' },
    { id: 'modules:read', label: 'View Modules' },
    { id: 'modules:write', label: 'Manage Modules' },
  ];

  const togglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New User"
      description="Create a new platform user"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as typeof formData.role })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant (Optional)
            </label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Platform Level</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availablePermissions.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit User Modal Component
function EditUserModal({
  user,
  tenants,
  onClose,
  onSubmit,
  loading,
}: {
  user: PlatformUser;
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (data: Partial<PlatformUser>) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId || '',
    status: user.status,
    permissions: user.permissions,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === formData.tenantId);
    onSubmit({
      ...formData,
      tenantId: formData.tenantId || undefined,
      tenantName: tenant?.name,
    });
  };

  const availablePermissions = [
    { id: 'tenants:read', label: 'View Tenants' },
    { id: 'tenants:write', label: 'Manage Tenants' },
    { id: 'users:read', label: 'View Users' },
    { id: 'users:write', label: 'Manage Users' },
    { id: 'billing:read', label: 'View Billing' },
    { id: 'billing:write', label: 'Manage Billing' },
    { id: 'modules:read', label: 'View Modules' },
    { id: 'modules:write', label: 'Manage Modules' },
  ];

  const togglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit User"
      description={`Editing ${user.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as PlatformUser['role'] })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant
            </label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Platform Level</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as PlatformUser['status'] })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availablePermissions.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// User Detail Modal Component
function UserDetailModal({
  user,
  onClose,
  onEdit,
  onDelete,
}: {
  user: PlatformUser;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = ROLE_ICONS[user.role];

  return (
    <Modal isOpen={true} onClose={onClose} title="User Details" size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-gray-500">{user.email}</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize mt-2 ${
                ROLE_COLORS[user.role]
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={user.status} size="md" />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Tenant</p>
            <p className="font-medium text-gray-900">
              {user.tenantName || 'Platform Level'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Last Login</p>
            <p className="font-medium text-gray-900">
              {user.lastLogin ? getRelativeTime(user.lastLogin) : 'Never'}
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
          {user.permissions.includes('all') ? (
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              All Permissions
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {perm}
                </span>
              ))}
              {user.permissions.length === 0 && (
                <p className="text-sm text-gray-500">No specific permissions</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Delete User
          </button>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              Edit User
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
