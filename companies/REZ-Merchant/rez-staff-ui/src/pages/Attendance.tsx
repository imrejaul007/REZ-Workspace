import React, { useState, useEffect } from 'react';
import { useAttendance, useAttendanceMutation, useStaff } from '../hooks/useStaff';
import { AttendanceRow } from '../components/AttendanceRow';
import { Attendance, AttendanceStatus } from '../types';
import { format } from 'date-fns';
import {
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

const statusOptions: { value: AttendanceStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'sick', label: 'Sick' },
  { value: 'vacation', label: 'Vacation' },
];

export function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: attendance, loading, error, refetch } = useAttendance();
  const { data: staff } = useStaff();
  const { checkIn, checkOut, loading: mutationLoading } = useAttendanceMutation();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredAttendance = attendance?.filter(att => {
    if (date && att.date !== date) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      if (!att.staffName.toLowerCase().includes(searchLower)) return false;
    }
    if (statusFilter && att.status !== statusFilter) return false;
    return true;
  }) || [];

  const todayStats = {
    present: attendance?.filter(a => a.date === date && a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.date === date && a.status === 'absent').length || 0,
    late: attendance?.filter(a => a.date === date && a.status === 'late').length || 0,
    halfDay: attendance?.filter(a => a.date === date && a.status === 'half_day').length || 0,
  };

  const handleCheckIn = async (staffId: string) => {
    try {
      await checkIn(staffId);
      setMessage({ type: 'success', text: 'Checked in successfully!' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Check-in failed' });
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      await checkOut(staffId);
      setMessage({ type: 'success', text: 'Checked out successfully!' });
      refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Check-out failed' });
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Date', 'Check In', 'Check Out', 'Status', 'Overtime (min)', 'Notes'].join(','),
      ...filteredAttendance.map(att => [
        att.staffName,
        att.date,
        att.checkIn || '',
        att.checkOut || '',
        att.status,
        att.overtimeMinutes,
        att.notes || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-500">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className={`btn-secondary ${showAllHistory ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            {showAllHistory ? 'Today Only' : 'View History'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{todayStats.present}</span>
          </div>
          <p className="text-sm text-gray-500">Present</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-gray-900">{todayStats.absent}</span>
          </div>
          <p className="text-sm text-gray-500">Absent</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{todayStats.late}</span>
          </div>
          <p className="text-sm text-gray-500">Late</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{todayStats.halfDay}</span>
          </div>
          <p className="text-sm text-gray-500">Half Day</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | '')}
              className="select"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {filteredAttendance.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No attendance records found</p>
          </div>
        ) : (
          filteredAttendance.map(att => (
            <AttendanceRow
              key={att.id}
              attendance={att}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          ))
        )}
      </div>

      {/* Quick Check-in Section */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Check-In</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {staff?.filter(s => s.status === 'active').slice(0, 8).map(member => {
            const todayAtt = attendance?.find(a => a.staffId === member.id && a.date === date);
            const isCheckedIn = todayAtt?.checkIn !== null;
            const isCheckedOut = todayAtt?.checkOut !== null;

            return (
              <div
                key={member.id}
                className={`p-3 rounded-lg border ${
                  isCheckedIn && !isCheckedOut
                    ? 'border-green-300 bg-green-50'
                    : isCheckedOut
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-xs font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{member.name}</p>
                </div>
                {isCheckedOut ? (
                  <span className="text-xs text-gray-500">Completed</span>
                ) : isCheckedIn ? (
                  <button
                    onClick={() => handleCheckOut(member.id)}
                    disabled={mutationLoading}
                    className="w-full text-xs py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Check Out
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckIn(member.id)}
                    disabled={mutationLoading}
                    className="w-full text-xs py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Check In
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
