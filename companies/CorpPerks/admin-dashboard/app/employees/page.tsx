'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { Card, Badge, Avatar, Button, Input, Select, Tabs, Pagination } from '@/components/ui';
import { useEmployees, useDebouncedSearch } from '@/hooks';
import { departments } from '@/lib/mock-data';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import type { Employee, EmployeeStatus, EmploymentType } from '@/types';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'probation', label: 'Probation' },
  { value: 'terminated', label: 'Terminated' },
];

const employmentTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const departmentOptions = [
  { value: '', label: 'All Departments' },
  ...departments.map((d) => ({ value: d.id, label: d.name })),
];

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    employees,
    loading,
    filters,
    setFilters,
    pagination,
    setPage,
  } = useEmployees({ pageSize: 10 });

  const { value: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    (query) => setFilters({ ...filters, search: query })
  );

  const tabs = [
    { id: 'all', label: 'All Employees', count: 134 },
    { id: 'active', label: 'Active', count: 128 },
    { id: 'on_leave', label: 'On Leave', count: 4 },
    { id: 'probation', label: 'Probation', count: 2 },
    { id: 'terminated', label: 'Terminated', count: 0 },
  ];

  const getStatusLabel = (status: EmployeeStatus): string => {
    const labels: Record<EmployeeStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      on_leave: 'On Leave',
      probation: 'Probation',
      terminated: 'Terminated',
    };
    return labels[status];
  };

  const getEmploymentTypeLabel = (type: EmploymentType): string => {
    const labels: Record<EmploymentType, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      intern: 'Intern',
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization&apos;s workforce
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="!p-0">
        <div className="border-b border-gray-100">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => {
              setActiveTab(tabId);
              setFilters({
                ...filters,
                status: tabId === 'all' ? undefined : (tabId as EmployeeStatus),
              });
            }}
          />
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchValue}
              onChange={handleSearchChange}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select
                label="Department"
                options={departmentOptions}
                value={filters.department || ''}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value || undefined })
                }
              />
              <Select
                label="Status"
                options={statusOptions}
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: (e.target.value || undefined) as EmployeeStatus | undefined,
                  })
                }
              />
              <Select
                label="Employment Type"
                options={employmentTypeOptions}
                value={filters.employmentType || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    employmentType: (e.target.value || undefined) as EmploymentType | undefined,
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No employees found</p>
            </div>
          ) : (
            employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    name={`${employee.firstName} ${employee.lastName}`}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <span className="text-xs text-gray-400">({employee.employeeId})</span>
                    </div>
                    <p className="text-xs text-gray-500">{employee.designation}</p>
                  </div>
                </div>

                <div className="hidden items-center gap-6 md:flex">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Department</p>
                    <p className="text-sm font-medium text-gray-700">{employee.department.name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-700">{employee.location}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Join Date</p>
                    <p className="text-sm font-medium text-gray-700">{formatDate(employee.joinDate)}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={employee.status === 'active' ? 'success' : employee.status === 'on_leave' ? 'warning' : 'default'} size="sm">
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEmployee(employee)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-100 p-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

// Employee Detail Modal
function EmployeeDetailModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar
              name={`${employee.firstName} ${employee.lastName}`}
              size="lg"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-sm text-gray-500">{employee.designation}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={employee.status === 'active' ? 'success' : 'warning'}
                  size="sm"
                >
                  {employee.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" size="sm">
                  {employee.employeeId}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-700">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm font-medium text-gray-700">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm font-medium text-gray-700">{employee.department.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-700">{employee.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Join Date</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(employee.joinDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Employment Type</p>
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {employee.employmentType.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700">Skills</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {employee.skills.map((skill) => (
                <Badge key={skill} variant="outline" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {employee.certifications.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700">Certifications</h4>
              <div className="mt-2 space-y-2">
                {employee.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{cert.name}</p>
                      <p className="text-xs text-gray-500">Issued by {cert.issuedBy}</p>
                    </div>
                    <Badge
                      variant={cert.status === 'valid' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button icon={<Edit className="h-4 w-4" />}>Edit Employee</Button>
        </div>
      </div>
    </div>
  );
}

// Add Employee Modal
function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    location: '',
    employmentType: 'full_time',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    logger.info('Add employee:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add New Employee</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="john.doe@corpperks.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Select
              label="Department"
              options={departmentOptions}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />

            <Input
              label="Designation"
              placeholder="Software Engineer"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
            />

            <Input
              label="Location"
              placeholder="Bangalore"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />

            <Select
              label="Employment Type"
              options={employmentTypeOptions}
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Employee</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
