import React, { useState, useEffect } from 'react';
import { useDashboardStats, useTodayAttendance, useShifts } from '../hooks/useStaff';
import { DashboardStats } from '../types';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';

export function Dashboard() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: attendance, loading: attendanceLoading } = useTodayAttendance();
  const { data: shifts, loading: shiftsLoading } = useShifts();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load dashboard data</p>
        <button onClick={refetchStats} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  const s = stats as DashboardStats;

  const statsCards = [
    {
      title: 'Staff On Duty',
      value: s.staffOnDuty,
      total: s.totalStaff,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/attendance',
    },
    {
      title: 'Present Today',
      value: s.presentToday,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/attendance',
    },
    {
      title: 'Absent Today',
      value: s.absentToday,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/attendance',
    },
    {
      title: 'Late Today',
      value: s.lateToday,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      link: '/attendance',
    },
  ];

  const upcomingShifts = shifts?.filter(sh => sh.status === 'scheduled').slice(0, 5) || [];
  const recentAttendance = attendance?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            {format(currentTime, 'EEEE, MMMM d, yyyy')} - {format(currentTime, 'h:mm a')}
          </p>
        </div>
        <Link to="/schedule" className="btn-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          View Schedule
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="card hover:shadow-md transition-shadow">
            <Link to={stat.link} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                    {stat.total && <span className="text-lg text-gray-400">/{stat.total}</span>}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Upcoming Shifts</h2>
            <Link to="/schedule" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {shiftsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : upcomingShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming shifts</p>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{shift.staffName}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(shift.date), 'EEE, MMM d')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{shift.startTime} - {shift.endTime}</p>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">
                      {shift.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-gray-900">Attendance Summary</h2>
            <Link to="/attendance" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {attendanceLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : recentAttendance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records</p>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 text-xs font-semibold">
                        {att.staffName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{att.staffName}</p>
                      <p className="text-xs text-gray-500">
                        {att.checkIn || '--:--'} - {att.checkOut || 'Present'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    att.status === 'present' ? 'bg-green-100 text-green-700' :
                    att.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    att.status === 'absent' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {att.status === 'present' ? 'Present' :
                     att.status === 'late' ? 'Late' :
                     att.status === 'absent' ? 'Absent' :
                     att.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/staff"
            className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center"
          >
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Manage Staff</p>
          </Link>
          <Link
            to="/attendance"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
          >
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Take Attendance</p>
          </Link>
          <Link
            to="/schedule"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
          >
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Edit Schedule</p>
          </Link>
          <Link
            to="/performance"
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">View Performance</p>
          </Link>
        </div>
      </div>

      {s.pendingSwaps > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">{s.pendingSwaps} Pending Swap Requests</p>
                <p className="text-sm text-gray-600">There are shift swap requests waiting for approval</p>
              </div>
            </div>
            <Link to="/swaps" className="btn-secondary">
              Review Requests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
