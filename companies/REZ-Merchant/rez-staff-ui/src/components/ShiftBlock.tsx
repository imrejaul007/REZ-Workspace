import React from 'react';
import { Shift, StaffRole, ShiftStatus } from '../types';
import { Clock, User } from 'lucide-react';

interface ShiftBlockProps {
  shift: Shift;
  onClick?: (shift: Shift) => void;
  onEdit?: (shift: Shift) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, shift: Shift) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const roleColors: Record<StaffRole, { bg: string; border: string; text: string }> = {
  manager: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  bartender: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  server: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  host: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  cook: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  busser: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
  security: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
};

const statusBadge: Record<ShiftStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
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

export function ShiftBlock({ shift, onClick, onEdit, draggable = false, onDragStart, onDragEnd }: ShiftBlockProps) {
  const colors = roleColors[shift.role];
  const status = statusBadge[shift.status];

  const handleClick = () => {
    if (onClick) onClick(shift);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(shift);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) onDragStart(e, shift);
    if (draggable) {
      e.dataTransfer.setData('shiftId', shift.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div
      className={`
        p-3 rounded-lg border-2 ${colors.border} ${colors.bg}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${shift.status === 'cancelled' ? 'opacity-50' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        transition-all hover:scale-[1.02]
      `}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${colors.text}`} />
          <span className="font-medium text-sm text-gray-900 truncate max-w-[100px]">
            {shift.staffName}
          </span>
        </div>
        <span className={`px-1.5 py-0.5 text-xs rounded ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 ${colors.text}`} />
        <span className={`text-xs font-medium ${colors.text}`}>
          {shift.startTime} - {shift.endTime}
        </span>
      </div>

      <div className="mt-2">
        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
          {roleLabels[shift.role]}
        </span>
      </div>

      {shift.notes && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{shift.notes}</p>
      )}

      {onEdit && shift.status !== 'cancelled' && shift.status !== 'completed' && (
        <button
          onClick={handleEdit}
          className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 py-1 border-t border-gray-200"
        >
          Edit Shift
        </button>
      )}
    </div>
  );
}
