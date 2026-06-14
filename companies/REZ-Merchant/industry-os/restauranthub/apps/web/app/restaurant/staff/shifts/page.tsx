'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface ShiftEmployee {
  id: string;
  name: string;
  role?: string;
}

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  totalHours: number | null;
  status: string;
  createdAt: string;
}

const emptyShiftForm = {
  employeeId: '',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
};

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<ShiftEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState(emptyShiftForm);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    return monday.toISOString().split('T')[0];
  });

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: Shift[]; total: number }>(
        `/staff/shifts?weekStart=${weekStart}`
      );
      setShifts(res.data.data ?? []);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: ShiftEmployee[] }>('/staff/employees?limit=100');
      setEmployees(res.data.data ?? []);
    } catch {
      // non-fatal; fallback to empty
    }
  }, []);

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, [fetchShifts, fetchEmployees]);

  const advanceWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const handleCreateShift = async () => {
    if (!shiftForm.employeeId || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/staff/shifts', shiftForm);
      toast.success('Shift scheduled');
      setIsCreateShiftOpen(false);
      setShiftForm(emptyShiftForm);
      fetchShifts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateShift = async () => {
    if (!editingShift) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/staff/shifts/${editingShift.id}`, shiftForm);
      toast.success('Shift updated');
      setEditingShift(null);
      setShiftForm(emptyShiftForm);
      fetchShifts();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm('Delete this shift?')) return;
    try {
      await apiClient.delete(`/staff/shifts/${id}`);
      toast.success('Shift deleted');
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete shift');
    }
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      employeeId: shift.employeeId,
      date: shift.date ? shift.date.split('T')[0] : '',
      startTime: shift.startTime ?? '',
      endTime: shift.endTime ?? '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'present':
        return <UserCheck className="h-4 w-4" />;
      case 'absent':
        return <UserX className="h-4 w-4" />;
      case 'late':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const ShiftFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Staff Member *</Label>
          <Select
            value={shiftForm.employeeId}
            onValueChange={(value) => setShiftForm({ ...shiftForm, employeeId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name} {emp.role ? `- ${emp.role}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input
            type="date"
            value={shiftForm.date}
            onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time *</Label>
          <Input
            type="time"
            value={shiftForm.startTime}
            onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Time *</Label>
          <Input
            type="time"
            value={shiftForm.endTime}
            onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          placeholder="Special instructions or notes..."
          value={shiftForm.notes}
          onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage staff shifts, track attendance and hours
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Dialog open={isCreateShiftOpen} onOpenChange={setIsCreateShiftOpen}>
              <DialogTrigger asChild>
                <Button size="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Shift</DialogTitle>
                  <DialogDescription>Create a new shift assignment for staff</DialogDescription>
                </DialogHeader>
                <ShiftFormFields />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShift} disabled={submitting}>
                    {submitting ? 'Scheduling...' : 'Schedule Shift'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => advanceWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Week of {weekStart}</span>
          <Button variant="outline" size="sm" onClick={() => advanceWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Shifts List */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Loading shifts...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Shifts ({shifts.length})</CardTitle>
              <CardDescription>Manage scheduled shifts and track attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No shifts found for this week</p>
                  <Button className="mt-4" onClick={() => setIsCreateShiftOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule First Shift
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift, index) => (
                    <motion.div
                      key={shift.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{shift.employeeName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className={getStatusColor(shift.status)}>
                              {getStatusIcon(shift.status)}
                              <span className="ml-1 capitalize">{shift.status}</span>
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(shift.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {shift.startTime ?? '--'} - {shift.endTime ?? '--'}
                        </div>
                        {shift.totalHours !== null && (
                          <div className="text-sm text-muted-foreground">{shift.totalHours}h</div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(shift)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Shift
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Shift
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Shift Dialog */}
        <Dialog open={!!editingShift} onOpenChange={(open) => !open && setEditingShift(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Shift</DialogTitle>
              <DialogDescription>Modify this shift assignment</DialogDescription>
            </DialogHeader>
            <ShiftFormFields />
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setEditingShift(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateShift} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
