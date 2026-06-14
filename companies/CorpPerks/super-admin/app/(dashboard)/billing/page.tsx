'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import DataTable, { Pagination } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import SearchInput, { SelectInput } from '@/components/ui/Input';
import StatsCard from '@/components/ui/StatsCard';
import {
  getBillingRecords,
  getBillingStats,
  createBillingRecord,
  updateBillingStatus,
  getTenants,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { BillingRecord, BillingStats, Tenant } from '@/types';

export default function BillingPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsData, statsData, tenantsData] = await Promise.all([
        getBillingRecords({
          page,
          limit: 10,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        }),
        getBillingStats(),
        getTenants({ limit: 100 }),
      ]);
      setRecords(recordsData.data);
      setStats(statsData);
      setTenants(tenantsData.data);
      setTotalPages(recordsData.totalPages);
      setTotalItems(recordsData.total);
    } catch (error) {
      logger.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRecord = async (data: {
    tenantId: string;
    amount: number;
    type: 'subscription' | 'addon' | 'overage' | 'one_time';
    description: string;
  }) => {
    setActionLoading(true);
    try {
      await createBillingRecord(data);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      logger.error('Failed to create billing record:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'paid' | 'pending' | 'overdue' | 'refunded') => {
    setActionLoading(true);
    try {
      await updateBillingStatus(id, status);
      fetchData();
    } catch (error) {
      logger.error('Failed to update billing status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const columns = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (record: BillingRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{record.tenantName}</p>
            <p className="text-xs text-gray-500">{record.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (record: BillingRecord) => (
        <span className="text-gray-600">{record.description}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (record: BillingRecord) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(record.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (record: BillingRecord) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(record.status)}
          <StatusBadge status={record.status} />
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (record: BillingRecord) => (
        <span className="text-gray-500">{formatDate(record.dueDate)}</span>
      ),
    },
    {
      key: 'paidAt',
      header: 'Paid',
      render: (record: BillingRecord) => (
        <span className="text-gray-500">
          {record.paidAt ? formatDate(record.paidAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (record: BillingRecord) => (
        <div className="flex items-center justify-end gap-1">
          {record.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(record.id, 'paid');
              }}
              className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
            >
              Mark Paid
            </button>
          )}
          {record.status === 'overdue' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(record.id, 'paid');
              }}
              className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
            >
              Mark Paid
            </button>
          )}
          {record.invoiceUrl && (
            <a
              href={record.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="w-4 h-4" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <Fragment>
      <DashboardWrapper
        title="Billing"
        subtitle="Revenue and payment management"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Invoice
          </button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="MRR"
            value={formatCurrency(stats?.mrr || 0)}
            change={12.5}
            icon={<TrendingUp className="w-5 h-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="ARR"
            value={formatCurrency(stats?.arr || 0)}
            icon={<CreditCard className="w-5 h-5" />}
          />
          <StatsCard
            title="Pending Payments"
            value={formatCurrency(stats?.pendingPayments || 0)}
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Overdue Payments"
            value={formatCurrency(stats?.overduePayments || 0)}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueByMonth || []}>
                <defs>
                  <linearGradient id="colorBillingRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBillingRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search billing records..."
            />
          </div>
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            placeholder="All Status"
          />
          <SelectInput
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'subscription', label: 'Subscription' },
              { value: 'addon', label: 'Add-on' },
              { value: 'overage', label: 'Overage' },
              { value: 'one_time', label: 'One Time' },
            ]}
            placeholder="All Types"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={records}
          keyField="id"
          loading={loading}
          emptyMessage="No billing records found"
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

        {/* Create Billing Record Modal */}
        {showCreateModal && (
          <CreateBillingModal
            tenants={tenants}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateRecord}
            loading={actionLoading}
          />
        )}
      </Fragment>
    </Fragment>
  );
}

// Create Billing Modal Component
function CreateBillingModal({
  tenants,
  onClose,
  onSubmit,
  loading,
}: {
  tenants: Tenant[];
  onClose: () => void;
  onSubmit: (data: {
    tenantId: string;
    amount: number;
    type: 'subscription' | 'addon' | 'overage' | 'one_time';
    description: string;
  }) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    tenantId: '',
    amount: '',
    type: 'subscription' as 'subscription' | 'addon' | 'overage' | 'one_time',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add Invoice"
      description="Create a new billing record"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenant *
          </label>
          <select
            required
            value={formData.tenantId}
            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as typeof formData.type })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="subscription">Subscription</option>
              <option value="addon">Add-on</option>
              <option value="overage">Overage</option>
              <option value="one_time">One Time</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Invoice description"
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
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
