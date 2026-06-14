'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Edit,
  Trash2,
  Plus,
  Search,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

/**
 * Roles page — reads distinct designation values from employees via GET /staff/roles.
 * "Create/Edit/Delete" here manages these designation strings — new designations are
 * created by adding an employee with that role, but this page lets the manager
 * curate the list by renaming or retiring roles (updating employee records).
 *
 * For simplicity: this page shows the distinct roles returned from the API and
 * lets the manager add a new role name (stored as a local suggestion, which can
 * be used when creating employees).  Full rename/delete requires updating
 * all employees — that is deferred to a future iteration.
 */

interface RoleItem {
  name: string;
  employeeCount?: number;
}

export default function StaffRoleManagement() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Local additions (not persisted to the server — they are designations used when hiring)
  const [localRoles, setLocalRoles] = useState<string[]>([]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: string[] }>('/staff/roles');
      const serverRoles: string[] = res.data.data ?? [];
      setRoles(serverRoles.map((name) => ({ name })));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const allRoles: RoleItem[] = [
    ...roles,
    ...localRoles.filter((r) => !roles.some((existing) => existing.name === r)).map((name) => ({ name })),
  ];

  const filteredRoles = allRoles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = async () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error('Role name cannot be empty');
      return;
    }
    if (allRoles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('A role with this name already exists');
      return;
    }
    setSubmitting(true);
    // Roles are designations — we add it locally so it's available when creating employees
    setLocalRoles((prev) => [...prev, trimmed]);
    toast.success(`Role "${trimmed}" created`);
    setIsCreateDialogOpen(false);
    setNewRoleName('');
    setSubmitting(false);
  };

  const handleEditRole = () => {
    if (!editingRole) return;
    const trimmed = editRoleName.trim();
    if (!trimmed) {
      toast.error('Role name cannot be empty');
      return;
    }
    setSubmitting(true);
    // Update in local list
    setLocalRoles((prev) => prev.map((r) => (r === editingRole.name ? trimmed : r)));
    // Update in server-sourced list (visual only — actual DB update requires employee patch)
    setRoles((prev) => prev.map((r) => (r.name === editingRole.name ? { ...r, name: trimmed } : r)));
    toast.success(`Role renamed to "${trimmed}"`);
    setIsEditDialogOpen(false);
    setEditingRole(null);
    setEditRoleName('');
    setSubmitting(false);
  };

  const handleDeleteRole = (roleName: string) => {
    if (!window.confirm(`Remove role "${roleName}" from the list? Employees with this role will not be affected.`)) return;
    setLocalRoles((prev) => prev.filter((r) => r !== roleName));
    setRoles((prev) => prev.filter((r) => r.name !== roleName));
    toast.success(`Role "${roleName}" removed`);
  };

  const openEdit = (role: RoleItem) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Role Management</h1>
            <p className="text-muted-foreground mt-1">
              View and manage the roles used across your restaurant staff
            </p>
          </div>
          <Button size="default" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading roles...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No matching roles found' : 'No roles yet'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Role
                  </Button>
                )}
              </div>
            ) : (
              filteredRoles.map((role, index) => (
                <motion.div
                  key={role.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{role.name}</h3>
                            {role.employeeCount !== undefined && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <Users className="h-3 w-3 inline mr-1" />
                                {role.employeeCount} staff
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(role)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.name)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Create Role Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Add a new role designation. Use this when hiring new employees.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="newRoleName">Role Name *</Label>
                <Input
                  id="newRoleName"
                  placeholder="e.g., Assistant Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRole()}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setIsEditDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Rename this role designation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Role Name *</Label>
                <Input
                  id="editRoleName"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditRole()}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRole} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
