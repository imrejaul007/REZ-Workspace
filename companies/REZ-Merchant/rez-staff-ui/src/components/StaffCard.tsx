import React from 'react';
import { Staff, StaffRole, StaffStatus } from '../types';
import { User, Mail, Phone, Calendar, DollarSign } from 'lucide-react';

interface StaffCardProps {
  staff: Staff;
  onEdit?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  compact?: boolean;
}

const roleColors: Record<StaffRole, string> = {
  manager: 'bg-purple-100 text-purple-800',
  bartender: 'bg-blue-100 text-blue-800',
  server: 'bg-green-100 text-green-800',
  host: 'bg-yellow-100 text-yellow-800',
  cook: 'bg-orange-100 text-orange-800',
  busser: 'bg-gray-100 text-gray-800',
  security: 'bg-red-100 text-red-800',
};

const statusColors: Record<StaffStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  on_leave: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
};

const roleLabels: Record<StaffRole, string> = {
  manager: 'Manager',
  bartender: 'Bartender',
  server: 'Server',
  host: 'Host',
  cook: 'Cook',
  busser: 'Busser',
  security: 'Security',
};

const statusLabels: Record<StaffStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  suspended: 'Suspended',
};

export function StaffCard({ staff, onEdit, onView, compact = false }: StaffCardProps) {
  const handleClick = () => {
    if (onView) onView(staff);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(staff);
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-700 font-semibold">
            {staff.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{staff.name}</p>
          <p className="text-sm text-gray-500">{roleLabels[staff.role]}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[staff.status]}`}>
          {statusLabels[staff.status]}
        </span>
      </div>
    );
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={handleClick}
        >
          <span className="text-white text-xl font-bold">
            {staff.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{staff.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[staff.status]}`}>
              {statusLabels[staff.status]}
            </span>
          </div>

          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${roleColors[staff.role]}`}>
            {roleLabels[staff.role]}
          </span>

          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{staff.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{staff.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Hired: {new Date(staff.hireDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>${staff.hourlyRate}/hr</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {staff.department}
            </span>
            <button
              onClick={handleEdit}
              className="ml-auto text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
