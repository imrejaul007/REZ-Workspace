import React from 'react';
import { Attendance, AttendanceStatus } from '../types';
import { Clock, CheckCircle, XCircle, AlertCircle, Coffee } from 'lucide-react';

interface AttendanceRowProps {
  attendance: Attendance;
  onCheckIn?: (staffId: string) => void;
  onCheckOut?: (staffId: string) => void;
  showActions?: boolean;
}

const statusConfig: Record<AttendanceStatus, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  present: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Present',
  },
  absent: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Absent',
  },
  late: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    label: 'Late',
  },
  half_day: {
    icon: <Coffee className="w-4 h-4" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    label: 'Half Day',
  },
  sick: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    label: 'Sick',
  },
  vacation: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Vacation',
  },
};

export function AttendanceRow({ attendance, onCheckIn, onCheckOut, showActions = true }: AttendanceRowProps) {
  const config = statusConfig[attendance.status];
  const isCheckedIn = attendance.checkIn !== null;
  const isCheckedOut = attendance.checkOut !== null;
  const canCheckOut = isCheckedIn && !isCheckedOut && attendance.status !== 'absent';

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-sm">
              {attendance.staffName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{attendance.staffName}</p>
            <p className="text-sm text-gray-500">{new Date(attendance.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}</p>
          </div>
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
        <span className={config.color}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center min-w-[60px]">
          <p className="text-xs text-gray-500">Check In</p>
          <p className={`font-medium ${isCheckedIn ? 'text-gray-900' : 'text-gray-400'}`}>
            {attendance.checkIn || '--:--'}
          </p>
        </div>

        <div className="text-center min-w-[60px]">
          <p className="text-xs text-gray-500">Check Out</p>
          <p className={`font-medium ${isCheckedOut ? 'text-gray-900' : 'text-gray-400'}`}>
            {attendance.checkOut || '--:--'}
          </p>
        </div>

        {attendance.overtimeMinutes > 0 && (
          <div className="text-center min-w-[60px]">
            <p className="text-xs text-gray-500">Overtime</p>
            <p className="font-medium text-orange-600">
              {Math.floor(attendance.overtimeMinutes / 60)}h {attendance.overtimeMinutes % 60}m
            </p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-2">
          {!isCheckedIn && attendance.status !== 'absent' && attendance.status !== 'sick' && attendance.status !== 'vacation' && (
            <button
              onClick={() => onCheckIn?.(attendance.staffId)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Check In
            </button>
          )}
          {canCheckOut && (
            <button
              onClick={() => onCheckOut?.(attendance.staffId)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check Out
            </button>
          )}
        </div>
      )}

      {attendance.notes && (
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          {attendance.notes}
        </div>
      )}
    </div>
  );
}
