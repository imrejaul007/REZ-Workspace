'use client';

import { useState } from 'react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'user_management' | 'content' | 'financial' | 'system' | 'reporting';
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
}

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const permissions: Permission[] = [
    // User Management
    { id: 'user.create', name: 'Create Users', description: 'Create new user accounts', category: 'user_management' },
    { id: 'user.read', name: 'View Users', description: 'View user profiles and details', category: 'user_management' },
    { id: 'user.update', name: 'Update Users', description: 'Edit user profiles and settings', category: 'user_management' },
    { id: 'user.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'user_management' },
    { id: 'user.suspend', name: 'Suspend Users', description: 'Suspend or ban user accounts', category: 'user_management' },
    
    // Content Management
    { id: 'content.moderate', name: 'Moderate Content', description: 'Review and moderate user content', category: 'content' },
    { id: 'content.delete', name: 'Delete Content', description: 'Remove inappropriate content', category: 'content' },
    { id: 'menu.approve', name: 'Approve Menus', description: 'Approve restaurant menu items', category: 'content' },
    { id: 'review.moderate', name: 'Moderate Reviews', description: 'Moderate customer reviews', category: 'content' },
    
    // Financial
    { id: 'payment.view', name: 'View Payments', description: 'View payment transactions', category: 'financial' },
    { id: 'payment.process', name: 'Process Payments', description: 'Process refunds and payouts', category: 'financial' },
    { id: 'commission.manage', name: 'Manage Commissions', description: 'Set and modify commission rates', category: 'financial' },
    { id: 'finance.analytics', name: 'Financial Analytics', description: 'Access financial reports and analytics', category: 'financial' },
    
    // System
    { id: 'system.config', name: 'System Configuration', description: 'Modify system settings', category: 'system' },
    { id: 'backup.manage', name: 'Manage Backups', description: 'Create and restore backups', category: 'system' },
    { id: 'audit.view', name: 'View Audit Logs', description: 'Access system audit logs', category: 'system' },
    { id: 'role.manage', name: 'Manage Roles', description: 'Create and modify user roles', category: 'system' },
    
    // Reporting
    { id: 'report.view', name: 'View Reports', description: 'Access system reports', category: 'reporting' },
    { id: 'report.export', name: 'Export Reports', description: 'Export reports in various formats', category: 'reporting' },
    { id: 'analytics.view', name: 'View Analytics', description: 'Access platform analytics', category: 'reporting' }
  ];

  const roles: Role[] = [
    {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      type: 'system',
      permissions: permissions.map(p => p.id),
      userCount: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isActive: true
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Standard admin with most permissions',
      type: 'system',
      permissions: [
        'user.create', 'user.read', 'user.update', 'user.suspend',
        'content.moderate', 'content.delete', 'menu.approve', 'review.moderate',
        'payment.view', 'payment.process', 'finance.analytics',
        'audit.view', 'report.view', 'report.export', 'analytics.view'
      ],
      userCount: 8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-12-15T10:30:00Z',
      isActive: true
    },
    {
      id: 'content_moderator',
      name: 'Content Moderator',
      description: 'Focused on content moderation and review management',
      type: 'custom',
      permissions: [
        'user.read', 'content.moderate', 'content.delete', 
        'menu.approve', 'review.moderate', 'report.view'
      ],
      userCount: 12,
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: '2024-11-20T14:15:00Z',
      isActive: true
    },
    {
      id: 'finance_manager',
      name: 'Finance Manager',
      description: 'Handles financial operations and analytics',
      type: 'custom',
      permissions: [
        'payment.view', 'payment.process', 'commission.manage',
        'finance.analytics', 'report.view', 'report.export'
      ],
      userCount: 3,
      createdAt: '2024-03-10T00:00:00Z',
      updatedAt: '2024-12-01T09:45:00Z',
      isActive: true
    },
    {
      id: 'support_agent',
      name: 'Support Agent',
      description: 'Customer support with limited user management',
      type: 'custom',
      permissions: [
        'user.read', 'user.update', 'content.moderate', 
        'payment.view', 'report.view'
      ],
      userCount: 15,
      createdAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-10-30T16:20:00Z',
      isActive: true
    },
    {
      id: 'readonly_analyst',
      name: 'Read-Only Analyst',
      description: 'View-only access for reporting and analytics',
      type: 'custom',
      permissions: [
        'user.read', 'payment.view', 'finance.analytics',
        'audit.view', 'report.view', 'analytics.view'
      ],
      userCount: 5,
      createdAt: '2024-05-15T00:00:00Z',
      updatedAt: '2024-09-12T11:30:00Z',
      isActive: false
    }
  ];

  const users: User[] = [
    {
      id: 'user_001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@resturistan.com',
      roleId: 'super_admin',
      roleName: 'Super Administrator',
      lastActive: '2025-01-15T14:30:00Z',
      status: 'active'
    },
    {
      id: 'user_002',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@resturistan.com',
      roleId: 'admin',
      roleName: 'Administrator',
      lastActive: '2025-01-15T11:45:00Z',
      status: 'active'
    },
    {
      id: 'user_003',
      name: 'Priya Patel',
      email: 'priya.patel@resturistan.com',
      roleId: 'content_moderator',
      roleName: 'Content Moderator',
      lastActive: '2025-01-15T09:20:00Z',
      status: 'active'
    },
    {
      id: 'user_004',
      name: 'Anita Desai',
      email: 'anita.desai@resturistan.com',
      roleId: 'finance_manager',
      roleName: 'Finance Manager',
      lastActive: '2025-01-14T16:15:00Z',
      status: 'active'
    },
    {
      id: 'user_005',
      name: 'Kumar Mehta',
      email: 'kumar.mehta@resturistan.com',
      roleId: 'support_agent',
      roleName: 'Support Agent',
      lastActive: '2025-01-13T13:30:00Z',
      status: 'inactive'
    }
  ];

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'user_management': return 'User Management';
      case 'content': return 'Content Management';
      case 'financial': return 'Financial Operations';
      case 'system': return 'System Administration';
      case 'reporting': return 'Reporting & Analytics';
      default: return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRoles = roles.filter(role => 
    searchTerm === '' || 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    searchTerm === '' ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-2 text-gray-600">Manage user roles, permissions, and access control</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles ({roles.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions ({permissions.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Assignments ({users.length})
            </button>
          </nav>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {activeTab === 'roles' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New Role
            </button>
          )}
        </div>

        {activeTab === 'roles' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Roles</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{role.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleTypeColor(role.type)}`}>
                          {role.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.userCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.permissions.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedRole(role)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {role.type === 'custom' && (
                          <>
                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {['user_management', 'content', 'financial', 'system', 'reporting'].map(category => (
              <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-900">{getCategoryDisplayName(category)}</h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPermissionsByCategory(category).map(permission => (
                      <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                            <p className="text-xs text-gray-400 mt-2 font-mono">{permission.id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Role Assignments</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.roleName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastActive).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">Change Role</button>
                        <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Role Details: {selectedRole.name}</h3>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role Name</label>
                    <p className="text-sm text-gray-900">{selectedRole.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-sm text-gray-900">{selectedRole.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Users Assigned</label>
                    <p className="text-sm text-gray-900">{selectedRole.userCount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm text-gray-900">{selectedRole.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRole.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-3 block">Permissions ({selectedRole.permissions.length})</label>
                  <div className="space-y-4">
                    {['user_management', 'content', 'financial', 'system', 'reporting'].map(category => {
                      const categoryPermissions = getPermissionsByCategory(category).filter(p => 
                        selectedRole.permissions.includes(p.id)
                      );
                      
                      if (categoryPermissions.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{getCategoryDisplayName(category)}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categoryPermissions.map(permission => (
                              <div key={permission.id} className="flex items-center p-2 bg-gray-50 rounded">
                                <span className="text-green-500 mr-2">✓</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                  <div className="text-xs text-gray-500">{permission.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                {selectedRole.type === 'custom' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit Role
                  </button>
                )}
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Create New Role</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter role name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the role and its responsibilities"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                  <div className="space-y-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {['user_management', 'content', 'financial', 'system', 'reporting'].map(category => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{getCategoryDisplayName(category)}</h4>
                        <div className="space-y-1">
                          {getPermissionsByCategory(category).map(permission => (
                            <label key={permission.id} className="flex items-start">
                              <input
                                type="checkbox"
                                className="mt-1 mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div>
                                <div className="text-sm text-gray-900">{permission.name}</div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}