'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  Puzzle,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Settings,
  Globe,
} from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import StatsCard from '@/components/ui/StatsCard';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import SearchInput, { SelectInput } from '@/components/ui/Input';
import {
  getModules,
  getTenantModules,
  assignModule,
  unassignModule,
  getTenants,
} from '@/lib/api';
import type { Module, TenantModule, Tenant } from '@/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  core: <Puzzle className="w-5 h-5" />,
  hr: <Users className="w-5 h-5" />,
  finance: <DollarSign className="w-5 h-5" />,
  analytics: <TrendingUp className="w-5 h-5" />,
  integrations: <Globe className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-purple-100 text-purple-600',
  hr: 'bg-blue-100 text-blue-600',
  finance: 'bg-green-100 text-green-600',
  analytics: 'bg-orange-100 text-orange-600',
  integrations: 'bg-cyan-100 text-cyan-600',
};

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modulesData, tenantModulesData, tenantsData] = await Promise.all([
        getModules({
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          tier: tierFilter || undefined,
        }),
        getTenantModules(),
        getTenants({ limit: 100 }),
      ]);
      setModules(modulesData);
      setTenantModules(tenantModulesData);
      setTenants(tenantsData.data);
    } catch (error) {
      logger.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, tierFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignModule = async (tenantId: string, moduleId: string) => {
    setActionLoading(true);
    try {
      await assignModule(tenantId, moduleId);
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      logger.error('Failed to assign module:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignModule = async (tenantId: string, moduleId: string) => {
    setActionLoading(true);
    try {
      await unassignModule(tenantId, moduleId);
      fetchData();
    } catch (error) {
      logger.error('Failed to unassign module:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getModuleStats = (moduleId: string) => {
    const assignments = tenantModules.filter((tm) => tm.moduleId === moduleId);
    return {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter((a) => a.status === 'active').length,
      trialAssignments: assignments.filter((a) => a.status === 'trial').length,
    };
  };

  const getTenantAssignments = (moduleId: string) => {
    return tenantModules.filter((tm) => tm.moduleId === moduleId);
  };

  const activeModules = modules.filter((m) => m.status === 'active').length;
  const betaModules = modules.filter((m) => m.status === 'beta').length;
  const totalAssignments = tenantModules.length;

  return (
    <Fragment>
      <DashboardWrapper title="Modules" subtitle="Module management and assignments">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Modules"
            value={modules.length}
            icon={<Puzzle className="w-5 h-5" />}
          />
          <StatsCard
            title="Active Modules"
            value={activeModules}
            icon={<CheckCircle className="w-5 h-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Beta Modules"
            value={betaModules}
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Total Assignments"
            value={totalAssignments}
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              value=""
              onChange={() => {}}
              placeholder="Search modules..."
            />
          </div>
          <SelectInput
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'core', label: 'Core' },
              { value: 'hr', label: 'HR' },
              { value: 'finance', label: 'Finance' },
              { value: 'analytics', label: 'Analytics' },
              { value: 'integrations', label: 'Integrations' },
            ]}
            placeholder="All Categories"
          />
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'beta', label: 'Beta' },
            ]}
            placeholder="All Status"
          />
          <SelectInput
            value={tierFilter}
            onChange={setTierFilter}
            options={[
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            placeholder="All Tiers"
          />
        </div>

        {/* Modules Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const stats = getModuleStats(module.id);
              const assignments = getTenantAssignments(module.id);

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 card-hover"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          CATEGORY_COLORS[module.category] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {CATEGORY_ICONS[module.category] || (
                          <Puzzle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {module.category}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={module.status} />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {module.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">
                        {stats.totalAssignments}
                      </p>
                      <p className="text-xs text-gray-500">Assigned</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">
                        {stats.activeAssignments}
                      </p>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">
                        {stats.trialAssignments}
                      </p>
                      <p className="text-xs text-blue-600">Trial</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      {module.required && (
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          Required
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {module.price === 0 ? 'Free' : `$${module.price}/mo`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedModule(module);
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => setSelectedModule(module)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Tenants */}
                  {assignments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Active on:</p>
                      <div className="flex flex-wrap gap-1">
                        {assignments.slice(0, 3).map((assignment) => (
                          <span
                            key={`${assignment.tenantId}-${assignment.moduleId}`}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {assignment.tenantName}
                          </span>
                        ))}
                        {assignments.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{assignments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Module Detail Modal */}
        {selectedModule && !showAssignModal && (
          <ModuleDetailModal
            module={selectedModule}
            assignments={getTenantAssignments(selectedModule.id)}
            tenants={tenants}
            onClose={() => setSelectedModule(null)}
            onAssign={() => setShowAssignModal(true)}
            onUnassign={handleUnassignModule}
          />
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedModule && (
          <AssignModuleModal
            module={selectedModule}
            tenants={tenants}
            existingAssignments={getTenantAssignments(selectedModule.id)}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedModule(null);
            }}
            onAssign={handleAssignModule}
            loading={actionLoading}
          />
        )}
      </Fragment>
    </Fragment>
  );
}

// Module Detail Modal
function ModuleDetailModal({
  module,
  assignments,
  tenants,
  onClose,
  onAssign,
  onUnassign,
}: {
  module: Module;
  assignments: TenantModule[];
  tenants: Tenant[];
  onClose: () => void;
  onAssign: () => void;
  onUnassign: (tenantId: string, moduleId: string) => void;
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Module Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              CATEGORY_COLORS[module.category] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {CATEGORY_ICONS[module.category] || <Puzzle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{module.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={module.status} size="md" />
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
                {module.tier}
              </span>
              {module.required && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                  Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">{module.description}</p>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium text-gray-900 capitalize">{module.category}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium text-gray-900">
              {module.price === 0 ? 'Free' : `$${module.price}/month`}
            </p>
          </div>
        </div>

        {/* Assigned Tenants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Assigned Tenants ({assignments.length})
            </h4>
            <button
              onClick={onAssign}
              className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              Assign to Tenant
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No tenants assigned to this module</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assignments.map((assignment) => (
                <div
                  key={`${assignment.tenantId}-${assignment.moduleId}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{assignment.tenantName}</p>
                    <p className="text-xs text-gray-500">
                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={assignment.status} />
                    <button
                      onClick={() => onUnassign(assignment.tenantId, assignment.moduleId)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
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

// Assign Module Modal
function AssignModuleModal({
  module,
  tenants,
  existingAssignments,
  onClose,
  onAssign,
  loading,
}: {
  module: Module;
  tenants: Tenant[];
  existingAssignments: TenantModule[];
  onClose: () => void;
  onAssign: (tenantId: string, moduleId: string) => void;
  loading: boolean;
}) {
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const assignedTenantIds = existingAssignments.map((a) => a.tenantId);
  const availableTenants = tenants.filter(
    (t) => !assignedTenantIds.includes(t.id) && t.status === 'active'
  );

  const handleAssign = () => {
    if (selectedTenantId) {
      onAssign(selectedTenantId, module.id);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Assign ${module.name}`}
      description="Select a tenant to assign this module"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Tenant *
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Choose a tenant...</option>
            {availableTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.plan})
              </option>
            ))}
          </select>
        </div>

        {selectedTenantId && (
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700">
              <strong>{module.name}</strong> will be assigned to the selected tenant.
              {module.price > 0 && (
                <span> This will add ${module.price}/month to their subscription.</span>
              )}
            </p>
          </div>
        )}

        {availableTenants.length === 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              All active tenants already have this module assigned.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTenantId || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Module'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
