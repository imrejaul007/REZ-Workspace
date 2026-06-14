'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import DataTable, { Pagination } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import SearchInput, { SelectInput } from '@/components/ui/Input';
import StatsCard from '@/components/ui/StatsCard';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  regenerateApiKey,
  getTenants,
} from '@/lib/api';
import { formatDate, getRelativeTime, maskApiKey } from '@/lib/utils';
import type { ApiKey, Tenant, CreateApiKeyInput } from '@/types';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<{ open: boolean; key: ApiKey | null }>({
    open: false,
    key: null,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysData, tenantsData] = await Promise.all([
        getApiKeys({
          page,
          limit: 10,
          status: statusFilter || undefined,
          tenantId: tenantFilter || undefined,
        }),
        getTenants({ limit: 100 }),
      ]);
      setApiKeys(keysData.data);
      setTenants(tenantsData.data);
      setTotalPages(keysData.totalPages);
      setTotalItems(keysData.total);
    } catch (error) {
      logger.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, tenantFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateKey = async (data: CreateApiKeyInput) => {
    setActionLoading(true);
    try {
      const newKey = await createApiKey(data);
      setShowCreateModal(false);
      setNewlyCreatedKey(newKey.key);
      setShowKeyModal(true);
      fetchData();
    } catch (error) {
      logger.error('Failed to create API key:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!confirmRevoke.key) return;
    setActionLoading(true);
    try {
      await revokeApiKey(confirmRevoke.key.id);
      setConfirmRevoke({ open: false, key: null });
      fetchData();
    } catch (error) {
      logger.error('Failed to revoke API key:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateKey = async (key: ApiKey) => {
    setActionLoading(true);
    try {
      const regenerated = await regenerateApiKey(key.id);
      if (regenerated) {
        setNewlyCreatedKey(regenerated.key);
        setShowKeyModal(true);
        fetchData();
      }
    } catch (error) {
      logger.error('Failed to regenerate API key:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Key className="w-4 h-4 text-gray-500" />;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (key: ApiKey) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{key.name}</p>
            <p className="text-xs text-gray-500">
              {key.tenantName || 'Platform Level'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'key',
      header: 'API Key',
      render: (key: ApiKey) => {
        const isVisible = visibleKeys.has(key.id);
        const isCopied = copiedKey === key.key;

        return (
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
              {isVisible ? key.key : maskApiKey(key.key)}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleKeyVisibility(key.id);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(key.key);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (key: ApiKey) => (
        <div className="flex flex-wrap gap-1">
          {key.permissions.includes('all') ? (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
              All
            </span>
          ) : (
            key.permissions.slice(0, 2).map((perm) => (
              <span
                key={perm}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
              >
                {perm}
              </span>
            ))
          )}
          {key.permissions.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{key.permissions.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (key: ApiKey) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(key.status)}
          <StatusBadge status={key.status} />
        </div>
      ),
    },
    {
      key: 'usageCount',
      header: 'Usage',
      render: (key: ApiKey) => (
        <span className="text-gray-600">
          {key.usageCount.toLocaleString()} calls
        </span>
      ),
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      render: (key: ApiKey) => (
        <span className="text-gray-500">
          {key.lastUsed ? getRelativeTime(key.lastUsed) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (key: ApiKey) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRegenerateKey(key);
            }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Regenerate key"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {key.status !== 'inactive' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmRevoke({ open: true, key });
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Revoke key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const activeKeys = apiKeys.filter((k) => k.status === 'active').length;
  const totalUsage = apiKeys.reduce((sum, k) => sum + k.usageCount, 0);

  return (
    <Fragment>
      <DashboardWrapper
        title="API Keys"
        subtitle="Manage platform and tenant API keys"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Keys"
            value={totalItems}
            icon={<Key className="w-5 h-5" />}
          />
          <StatsCard
            title="Active Keys"
            value={activeKeys}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Total API Calls"
            value={totalUsage.toLocaleString()}
            icon={<Shield className="w-5 h-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Platform Keys"
            value={apiKeys.filter((k) => !k.tenantId).length}
            icon={<Key className="w-5 h-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value=""
              onChange={() => {}}
              placeholder="Search API keys..."
            />
          </div>
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'expired', label: 'Expired' },
            ]}
            placeholder="All Status"
          />
          <SelectInput
            value={tenantFilter}
            onChange={setTenantFilter}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="All Tenants"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={apiKeys}
          keyField="id"
          loading={loading}
          emptyMessage="No API keys found"
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

        {/* Create API Key Modal */}
        {showCreateModal && (
          <CreateApiKeyModal
            tenants={tenants}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateKey}
            loading={actionLoading}
          />
        )}

        {/* Show New Key Modal */}
        {showKeyModal && newlyCreatedKey && (
          <ShowKeyModal
            keyValue={newlyCreatedKey}
            onClose={() => {
              setShowKeyModal(false);
              setNewlyCreatedKey(null);
            }}
          />
        )}

        {/* Confirm Revoke Modal */}
        <ConfirmModal
          isOpen={confirmRevoke.open}
          onClose={() => setConfirmRevoke({ open: false, key: null })}
          onConfirm={handleRevokeKey}
          title="Revoke API Key"
          message={`Are you sure you want to revoke "${confirmRevoke.key?.name}"? This action cannot be undone and any applications using this key will lose access.`}
          confirmText="Revoke"
          variant="danger"
          loading={actionLoading}
        />
      </Fragment>
    </Fragment>
  );
}

// Create API Key Modal Component
function CreateApiKeyModal({
  tenants,
  onClose,
  onSubmit,
  loading,
}: {
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (data: CreateApiKeyInput) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    tenantId: '',
    permissions: [] as string[],
    expiresIn: 365,
  });

  const availablePermissions = [
    { id: 'read', label: 'Read', description: 'Read access to all data' },
    { id: 'write', label: 'Write', description: 'Write access to create/update data' },
    { id: 'webhooks', label: 'Webhooks', description: 'Webhook management access' },
    { id: 'admin', label: 'Admin', description: 'Full admin access' },
  ];

  const togglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter((p) => p !== id)
        : [...prev.permissions, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      tenantId: formData.tenantId || undefined,
      permissions: formData.permissions.length > 0 ? formData.permissions : ['read'],
      expiresIn: formData.expiresIn,
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create API Key"
      description="Generate a new API key for platform or tenant access"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Production API Key"
          />
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
            <option value="">Platform Level (Internal Use)</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Leave empty for platform-level API key
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="space-y-2">
            {availablePermissions.map((perm) => (
              <label
                key={perm.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                  <p className="text-xs text-gray-500">{perm.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expires In
          </label>
          <select
            value={formData.expiresIn}
            onChange={(e) => setFormData({ ...formData, expiresIn: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
            <option value={730}>2 years</option>
            <option value={0}>Never expires</option>
          </select>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Store your API key securely
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                The API key will only be shown once. Make sure to copy and store it safely.
              </p>
            </div>
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
            disabled={loading || !formData.name}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Show Key Modal Component
function ShowKeyModal({
  keyValue,
  onClose,
}: {
  keyValue: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="API Key Created" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Your new API key has been created successfully
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm font-mono text-gray-800 break-all">
              {visible ? keyValue : maskApiKey(keyValue)}
            </code>
            <button
              onClick={() => setVisible(!visible)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Make sure to copy and store your API key securely. You will not be able to view it again.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
