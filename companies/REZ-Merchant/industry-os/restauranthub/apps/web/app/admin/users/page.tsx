'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'RESTAURANT' | 'EMPLOYEE' | 'VENDOR' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  phoneVerified: boolean;
  registrationDate: string;
  lastLoginDate?: string;
  totalOrders?: number;
  totalSpent?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (roleFilter) params.set('role', roleFilter);
        if (statusFilter) params.set('status', statusFilter);
        params.set('page', String(currentPage));
        params.set('limit', String(usersPerPage));

        const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.users || []);
        } else if (res.status === 404 || res.status === 403) {
          setUsers([]);
        } else {
          setError('Failed to load users. Please try again.');
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, currentPage]);

  const handleStatusUpdate = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, status: newStatus } : u)
        );
      }
    } catch {
      // silently fail — UI will retain current state
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'RESTAURANT': return 'default';
      case 'EMPLOYEE': return 'secondary';
      default: return 'outline';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING_VERIFICATION').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform users and their accounts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="VENDOR">Vendor</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Could not load users</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'No users have registered on the platform yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleBadgeVariant(user.role) as unknown}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                        user.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1 text-xs">
                        <span className={`px-2 py-1 rounded-full ${user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Email {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.registrationDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/users/${user.id}`}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {user.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
