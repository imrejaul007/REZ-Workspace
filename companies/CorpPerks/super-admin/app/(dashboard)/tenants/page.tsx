'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  Filter,
} from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import DataTable, { Pagination } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { StatusBadge, PlanBadge } from '@/components/ui/Badge';
import SearchInput, { SelectInput } from '@/components/ui/Input';
import StatsCard from '@/components/ui/StatsCard';
import {
  getTenants,
  getTenantStats,
  createTenant,
  updateTenant,
  deleteTenant,
  suspendTenant,
  activateTenant,
} from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { Tenant, TenantStats, CreateTenantInput } from '@/types';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; tenant: Tenant | null }>({
    open: false,
    tenant: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantsData, statsData] = await Promise.all([
        getTenants({
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter || undefined,
          plan: planFilter || undefined,
        }),
        getTenantStats(),
      ]);
      setTenants(tenantsData.data);
      setStats(statsData);
      setTotalPages(tenantsData.totalPages);
      setTotalItems(tenantsData.total);
    } catch (error) {
      logger.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTenant = async (data: CreateTenantInput) => {
    setActionLoading(true);
    try {
      await createTenant(data);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      logger.error('Failed to create tenant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTenant = async (id: string, data: Partial<Tenant>) => {
    setActionLoading(true);
    try {
      await updateTenant(id, data);
      setShowEditModal(false);
      setSelectedTenant(null);
      fetchData();
    } catch (error) {
      logger.error('Failed to update tenant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!confirmDelete.tenant) return;
    setActionLoading(true);
    try {
      await deleteTenant(confirmDelete.tenant.id);
      setConfirmDelete({ open: false, tenant: null });
      fetchData();
    } catch (error) {
      logger.error('Failed to delete tenant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendTenant = async (tenant: Tenant) => {
    setActionLoading(true);
    try {
      await suspendTenant(tenant.id);
      fetchData();
    } catch (error) {
      logger.error('Failed to suspend tenant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateTenant = async (tenant: Tenant) => {
    setActionLoading(true);
    try {
      await activateTenant(tenant.id);
      fetchData();
    } catch (error) {
      logger.error('Failed to activate tenant:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-3">
          <img
            src={tenant.logo}
            alt={tenant.name}
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <p className="font-medium text-gray-900">{tenant.name}</p>
            <p className="text-xs text-gray-500">{tenant.domain}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (tenant: Tenant) => (
        <span className="text-gray-600">{tenant.industry}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (tenant: Tenant) => <PlanBadge plan={tenant.plan} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (tenant: Tenant) => <StatusBadge status={tenant.status} />,
    },
    {
      key: 'userCount',
      header: 'Users',
      render: (tenant: Tenant) => (
        <span className="text-gray-900">
          {formatNumber(tenant.userCount)} / {tenant.maxUsers}
        </span>
      ),
    },
    {
      key: 'monthlyRevenue',
      header: 'Revenue',
      render: (tenant: Tenant) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(tenant.monthlyRevenue)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (tenant: Tenant) => (
        <span className="text-gray-500">{formatDate(tenant.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (tenant: Tenant) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTenant(tenant);
              setShowDetailModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTenant(tenant);
              setShowEditModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {tenant.status === 'active' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSuspendTenant(tenant);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : tenant.status === 'suspended' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleActivateTenant(tenant);
              }}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Fragment>
      <DashboardWrapper
        title="Tenants"
        subtitle={`${stats?.total || 0} companies on the platform`}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tenant
          </button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Tenants"
            value={stats?.total || 0}
            icon={<Building2 className="w-5 h-5" />}
          />
          <StatsCard
            title="Active"
            value={stats?.active || 0}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Pending"
            value={stats?.pending || 0}
            icon={<Filter className="w-5 h-5" />}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Suspended"
            value={stats?.suspended || 0}
            icon={<Ban className="w-5 h-5" />}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search tenants..."
            />
          </div>
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            placeholder="All Status"
          />
          <SelectInput
            value={planFilter}
            onChange={setPlanFilter}
            options={[
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            placeholder="All Plans"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={tenants}
          keyField="id"
          loading={loading}
          emptyMessage="No tenants found"
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

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <CreateTenantModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTenant}
            loading={actionLoading}
          />
        )}

        {/* Edit Tenant Modal */}
        {showEditModal && selectedTenant && (
          <EditTenantModal
            tenant={selectedTenant}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTenant(null);
            }}
            onSubmit={(data) => handleUpdateTenant(selectedTenant.id, data)}
            loading={actionLoading}
          />
        )}

        {/* Tenant Detail Modal */}
        {showDetailModal && selectedTenant && (
          <TenantDetailModal
            tenant={selectedTenant}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedTenant(null);
            }}
            onDelete={() => {
              setConfirmDelete({ open: true, tenant: selectedTenant });
            }}
          />
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, tenant: null })}
          onConfirm={handleDeleteTenant}
          title="Delete Tenant"
          message={`Are you sure you want to delete "${confirmDelete.tenant?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={actionLoading}
        />
      </Fragment>
    </Fragment>
  );
}

// Create Tenant Modal Component
function CreateTenantModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: CreateTenantInput) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<CreateTenantInput>({
    name: '',
    slug: '',
    domain: '',
    industry: '',
    plan: 'starter',
    adminName: '',
    adminEmail: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Tenant"
      description="Create a new tenant on the platform"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
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
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain *
            </label>
            <input
              type="text"
              required
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry *
            </label>
            <select
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan *
            </label>
            <select
              required
              value={formData.plan}
              onChange={(e) =>
                setFormData({ ...formData, plan: e.target.value as CreateTenantInput['plan'] })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Name *
            </label>
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Email *
          </label>
          <input
            type="email"
            required
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Tenant Modal Component
function EditTenantModal({
  tenant,
  onClose,
  onSubmit,
  loading,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSubmit: (data: Partial<Tenant>) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: tenant.name,
    industry: tenant.industry,
    plan: tenant.plan,
    status: tenant.status,
    maxUsers: tenant.maxUsers,
    adminName: tenant.adminName,
    adminEmail: tenant.adminEmail,
    billingEmail: tenant.billingEmail,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Tenant"
      description={`Editing ${tenant.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
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
              Industry
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as Tenant['plan'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Tenant['status'] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Users
            </label>
            <input
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Name
            </label>
            <input
              type="text"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Email
            </label>
            <input
              type="email"
              value={formData.billingEmail}
              onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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

// Tenant Detail Modal Component
function TenantDetailModal({
  tenant,
  onClose,
  onDelete,
}: {
  tenant: Tenant;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Tenant Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <img
            src={tenant.logo}
            alt={tenant.name}
            className="w-16 h-16 rounded-xl"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{tenant.name}</h3>
            <p className="text-gray-500">{tenant.domain}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={tenant.status} size="md" />
              <PlanBadge plan={tenant.plan} size="md" />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Industry</p>
            <p className="font-medium text-gray-900">{tenant.industry}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="font-medium text-gray-900">{formatCurrency(tenant.monthlyRevenue)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Users</p>
            <p className="font-medium text-gray-900">
              {formatNumber(tenant.userCount)} / {tenant.maxUsers}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">API Calls</p>
            <p className="font-medium text-gray-900">{formatNumber(tenant.apiCalls)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{formatDate(tenant.createdAt)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">{formatDate(tenant.updatedAt)}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Admin:</span> {tenant.adminName} ({tenant.adminEmail})
            </p>
            {tenant.phone && (
              <p className="text-sm">
                <span className="text-gray-500">Phone:</span> {tenant.phone}
              </p>
            )}
            <p className="text-sm">
              <span className="text-gray-500">Billing:</span> {tenant.billingEmail}
            </p>
            {tenant.address && (
              <p className="text-sm">
                <span className="text-gray-500">Address:</span> {tenant.address}, {tenant.city}, {tenant.country}
              </p>
            )}
          </div>
        </div>

        {/* Modules */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Assigned Modules ({tenant.modules.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {tenant.modules.map((module) => (
              <span
                key={module}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
              >
                {module}
              </span>
            ))}
            {tenant.modules.length === 0 && (
              <p className="text-sm text-gray-500">No modules assigned</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Delete Tenant
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
