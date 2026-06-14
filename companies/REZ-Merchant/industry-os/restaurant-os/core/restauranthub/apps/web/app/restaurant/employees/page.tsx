'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  User,
  UserCheck,
  Award,
  TrendingUp,
  Users,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  salary: number | null;
  startDate: string;
  isActive: boolean;
  createdAt: string;
}

interface EmployeesResponse {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RestaurantEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (departmentFilter !== 'all') params.set('department', departmentFilter);
      const res = await apiClient.get<EmployeesResponse>(`/staff/employees?${params.toString()}`);
      setEmployees(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, departmentFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate employee "${name}"? They will no longer appear as active staff.`)) return;
    try {
      await apiClient.delete(`/staff/employees/${id}`);
      toast.success(`${name} deactivated`);
      fetchEmployees();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to deactivate employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term) ||
      (emp.email ?? '').toLowerCase().includes(term)
    );
  });

  const statsCards = [
    {
      title: 'Total Employees',
      value: total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Active Staff',
      value: employees.filter((e) => e.isActive).length,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant staff and track performance
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Link href="/restaurant/employees/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, role, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Departments</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Service">Service</option>
                <option value="Bar">Bar</option>
                <option value="Management">Management</option>
                <option value="Front of House">Front of House</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading employees...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Staff Directory ({filteredEmployees.length} shown)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || departmentFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first employee'}
                  </p>
                  <Link href="/restaurant/employees/add">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="p-6 rounded-lg border hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{employee.name}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  employee.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}
                              >
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{employee.role}</span>
                                  {employee.department && (
                                    <>
                                      <span>•</span>
                                      <span>{employee.department}</span>
                                    </>
                                  )}
                                </div>
                                {employee.email && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{employee.email}</span>
                                  </div>
                                )}
                                {employee.phone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{employee.phone}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>
                                    Joined:{' '}
                                    {new Date(employee.startDate).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                                {employee.salary && (
                                  <div className="flex items-center gap-1">
                                    <Award className="h-3.5 w-3.5" />
                                    <span>Salary: ₹{employee.salary.toLocaleString()}/mo</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/restaurant/employees/${employee.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/restaurant/employees/${employee.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / limit)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
