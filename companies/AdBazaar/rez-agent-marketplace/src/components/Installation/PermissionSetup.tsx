'use client';

import { useState } from 'react';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';

const PERMISSION_GROUPS = [
  {
    id: 'data',
    name: 'Data Access',
    permissions: [
      { id: 'customer_data', label: 'Customer Data', description: 'View and manage customer profiles and history' },
      { id: 'transaction_data', label: 'Transaction Data', description: 'Access sales, payments, and refunds' },
      { id: 'inventory_data', label: 'Inventory Data', description: 'View and modify stock levels' },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    permissions: [
      { id: 'process_payments', label: 'Process Payments', description: 'Handle transactions and refunds' },
      { id: 'send_messages', label: 'Send Messages', description: 'Email and SMS to customers' },
      { id: 'modify_records', label: 'Modify Records', description: 'Edit business data and settings' },
    ],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    permissions: [
      { id: 'api_access', label: 'API Access', description: 'Connect to third-party services' },
      { id: 'webhooks', label: 'Webhooks', description: 'Send data to external systems' },
    ],
  },
];

export default function PermissionSetup() {
  const { installationConfig, updateInstallationConfig } = useMarketplaceStore();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    installationConfig?.permissions || ['customer_data', 'send_messages']
  );

  const togglePermission = (permissionId: string) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(p => p !== permissionId)
      : [...selectedPermissions, permissionId];

    setSelectedPermissions(newPermissions);
    updateInstallationConfig({ permissions: newPermissions });
  };

  const selectAllInGroup = (groupId: string) => {
    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const allIds = group.permissions.map(p => p.id);
    const allSelected = allIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all in group
      setSelectedPermissions(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      // Select all in group
      setSelectedPermissions(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Permission Setup</h2>
          <p className="text-sm text-gray-500">Configure what this agent can access and do</p>
        </div>
      </div>

      {/* Permission Groups */}
      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => {
          const groupPermissions = group.permissions.map(p => p.id);
          const selectedCount = groupPermissions.filter(id => selectedPermissions.includes(id)).length;
          const allSelected = selectedCount === groupPermissions.length;

          return (
            <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => selectAllInGroup(group.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium">{group.name}</span>
                  <span className="text-xs text-gray-500">
                    ({selectedCount}/{groupPermissions.length})
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPermissions.includes(permission.id)
                        ? 'bg-blue-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{permission.label}</p>
                      <p className="text-sm text-gray-500">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedPermissions.length} permissions enabled
            </p>
            <p className="text-sm text-gray-500">
              You can change these permissions anytime in agent settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
