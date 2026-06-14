import React, { useState, useMemo } from 'react';
import { useShifts, useStaff, useShiftMutation } from '../hooks/useStaff';
import { ShiftBlock } from '../components/ShiftBlock';
import { Shift, StaffRole } from '../types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  GripVertical,
} from 'lucide-react';

const hours = Array.from({ length: 13 }, (_, i) => i + 9); // 9 AM to 9 PM
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const roleColors: Record<StaffRole, { bg: string; border: string }> = {
  manager: { bg: 'bg-purple-100', border: 'border-purple-300' },
  bartender: { bg: 'bg-blue-100', border: 'border-blue-300' },
  server: { bg: 'bg-green-100', border: 'border-green-300' },
  host: { bg: 'bg-yellow-100', border: 'border-yellow-300' },
  cook: { bg: 'bg-orange-100', border: 'border-orange-300' },
  busser: { bg: 'bg-gray-100', border: 'border-gray-300' },
  security: { bg: 'bg-red-100', border: 'border-red-300' },
};

export function Schedule() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: number; hour: number } | null>(null);

  const { data: shifts, loading, refetch } = useShifts();
  const { data: staff } = useStaff();
  const { create, update, assign, loading: mutationLoading } = useShiftMutation();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const shiftsByDay = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      grouped[dateStr] = shifts?.filter(s => s.date === dateStr) || [];
    });
    return grouped;
  }, [shifts, weekDays]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    setDraggedShift(shift);
    e.dataTransfer.setData('shiftId', shift.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedShift(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, day: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ day, hour });
  };

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedShift) return;

    const targetDate = format(weekDays[day], 'yyyy-MM-dd');
    const newStartHour = dropTarget?.hour || parseInt(draggedShift.startTime.split(':')[0]);

    try {
      await update(draggedShift.id, {
        date: targetDate,
        startTime: `${String(newStartHour).padStart(2, '0')}:00`,
        endTime: `${String(newStartHour + 8).padStart(2, '0')}:00`,
      });
      refetch();
    } catch (err) {
      console.error('Failed to move shift:', err);
    }

    setDraggedShift(null);
    setDropTarget(null);
  };

  const handleAddShift = async (data: Omit<Shift, 'id'>) => {
    try {
      await create(data);
      setShowAddModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to add shift:', err);
    }
  };

  const handleUpdateShift = async (id: string, data: Partial<Shift>) => {
    try {
      await update(id, data);
      setEditingShift(null);
      refetch();
    } catch (err) {
      console.error('Failed to update shift:', err);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-gray-500">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="btn-secondary">
            Today
          </button>
          <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 text-center text-sm font-medium text-gray-500">Time</div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-3 text-center ${
                  isSameDay(day, new Date())
                    ? 'bg-primary-50 border-b-2 border-primary-500'
                    : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-500">{daysOfWeek[day.getDay()]}</p>
                <p className={`text-lg ${isSameDay(day, new Date()) ? 'text-primary-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-3 text-center text-sm text-gray-500 border-r border-gray-200">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayShifts = shiftsByDay[dateStr]?.filter(s => {
                    const shiftHour = parseInt(s.startTime.split(':')[0]);
                    return shiftHour === hour;
                  }) || [];

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        min-h-[80px] p-1 border-r border-gray-100 transition-colors
                        ${dropTarget?.day === dayIndex && dropTarget?.hour === hour ? 'bg-primary-50' : ''}
                        ${draggedShift ? 'hover:bg-gray-50' : ''}
                      `}
                      onDragOver={(e) => handleDragOver(e, dayIndex, hour)}
                      onDrop={(e) => handleDrop(e, dayIndex)}
                    >
                      {dayShifts.map(shift => (
                        <ShiftBlock
                          key={shift.id}
                          shift={shift}
                          onClick={() => setSelectedShift(shift)}
                          onEdit={() => setEditingShift(shift)}
                          draggable
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Role Legend</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(roleColors).map(([role, colors]) => (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
              <span className="text-sm text-gray-600 capitalize">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && staff && (
        <ShiftModal
          staff={staff}
          weekDays={weekDays}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddShift}
          loading={mutationLoading}
        />
      )}

      {editingShift && (
        <ShiftModal
          shift={editingShift}
          staff={staff || []}
          weekDays={weekDays}
          onClose={() => setEditingShift(null)}
          onSubmit={(data) => handleUpdateShift(editingShift.id, data)}
          loading={mutationLoading}
        />
      )}

      {selectedShift && !editingShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Shift Details</h2>
                <button onClick={() => setSelectedShift(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Staff Member</p>
                    <p className="font-medium">{selectedShift.staffName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedShift.startTime} - {selectedShift.endTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{format(new Date(selectedShift.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    roleColors[selectedShift.role].bg
                  }`}>
                    {selectedShift.role}
                  </span>
                </div>

                {selectedShift.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{selectedShift.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelectedShift(null)} className="btn-secondary flex-1">
                  Close
                </button>
                <button onClick={() => { setEditingShift(selectedShift); setSelectedShift(null); }} className="btn-primary flex-1">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ShiftModalProps {
  shift?: Shift;
  staff: { id: string; name: string; role: StaffRole }[];
  weekDays: Date[];
  onClose: () => void;
  onSubmit: (data: Omit<Shift, 'id'> | Partial<Shift>) => void;
  loading?: boolean;
}

function ShiftModal({ shift, staff, weekDays, onClose, onSubmit, loading }: ShiftModalProps) {
  const [formData, setFormData] = useState({
    staffId: shift?.staffId || '',
    staffName: shift?.staffName || '',
    date: shift?.date || format(weekDays[0], 'yyyy-MM-dd'),
    startTime: shift?.startTime || '09:00',
    endTime: shift?.endTime || '17:00',
    role: shift?.role || 'server' as StaffRole,
    status: shift?.status || 'scheduled' as Shift['status'],
    notes: shift?.notes || '',
  });

  const handleStaffChange = (staffId: string) => {
    const selected = staff.find(s => s.id === staffId);
    setFormData({
      ...formData,
      staffId,
      staffName: selected?.name || '',
      role: selected?.role || formData.role,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {shift ? 'Edit Shift' : 'Add New Shift'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                value={formData.staffId}
                onChange={(e) => handleStaffChange(e.target.value)}
                className="select"
                required
              >
                <option value="">Select staff member</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="select"
                required
              >
                {weekDays.map((day, i) => (
                  <option key={i} value={format(day, 'yyyy-MM-dd')}>
                    {format(day, 'EEEE, MMMM d')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input min-h-[80px]"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Saving...' : shift ? 'Update' : 'Add Shift'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
