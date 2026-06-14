'use client';

import { useState, useCallback } from 'react';
import styles from './page.module.css';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  breakMinutes: number;
}

interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const departments = ['All', 'Kitchen', 'Service', 'Bar', 'Management', 'Housekeeping'];
const roles = ['Server', 'Chef', 'Bartender', 'Manager', 'Host', 'Busser', 'Cook'];

const shiftTemplates: ShiftTemplate[] = [
  { id: '1', name: 'Morning', startTime: '06:00', endTime: '14:00', breakMinutes: 30 },
  { id: '2', name: 'Afternoon', startTime: '14:00', endTime: '22:00', breakMinutes: 30 },
  { id: '3', name: 'Night', startTime: '22:00', endTime: '06:00', breakMinutes: 60 },
  { id: '4', name: 'Split', startTime: '11:00', endTime: '15:00', breakMinutes: 0 },
];

const mockEmployees = [
  { id: '1', name: 'Priya Sharma', role: 'Server', department: 'Service', avatar: 'PS' },
  { id: '2', name: 'Rahul Verma', role: 'Chef', department: 'Kitchen', avatar: 'RV' },
  { id: '3', name: 'Sneha Patel', role: 'Manager', department: 'Management', avatar: 'SP' },
  { id: '4', name: 'Amit Kumar', role: 'Bartender', department: 'Bar', avatar: 'AK' },
  { id: '5', name: 'Neha Singh', role: 'Server', department: 'Service', avatar: 'NS' },
  { id: '6', name: 'Vikram Rao', role: 'Cook', department: 'Kitchen', avatar: 'VR' },
  { id: '7', name: 'Kavita Reddy', role: 'Host', department: 'Service', avatar: 'KR' },
  { id: '8', name: 'Sanjay Gupta', role: 'Busser', department: 'Service', avatar: 'SG' },
];

const mockShifts: Shift[] = [
  { id: '1', employeeId: '1', employeeName: 'Priya Sharma', role: 'Server', department: 'Service', date: '2026-05-21', startTime: '09:00', endTime: '17:00', status: 'confirmed', breakMinutes: 30 },
  { id: '2', employeeId: '2', employeeName: 'Rahul Verma', role: 'Chef', department: 'Kitchen', date: '2026-05-21', startTime: '10:00', endTime: '20:00', status: 'in-progress', breakMinutes: 45 },
  { id: '3', employeeId: '3', employeeName: 'Sneha Patel', role: 'Manager', department: 'Management', date: '2026-05-21', startTime: '08:00', endTime: '18:00', status: 'confirmed', breakMinutes: 60 },
  { id: '4', employeeId: '4', employeeName: 'Amit Kumar', role: 'Bartender', department: 'Bar', date: '2026-05-21', startTime: '16:00', endTime: '00:00', status: 'scheduled', breakMinutes: 30 },
  { id: '5', employeeId: '5', employeeName: 'Neha Singh', role: 'Server', department: 'Service', date: '2026-05-21', startTime: '17:00', endTime: '23:00', status: 'scheduled', breakMinutes: 30 },
  { id: '6', employeeId: '6', employeeName: 'Vikram Rao', role: 'Cook', department: 'Kitchen', date: '2026-05-22', startTime: '06:00', endTime: '14:00', status: 'scheduled', breakMinutes: 45 },
  { id: '7', employeeId: '7', employeeName: 'Kavita Reddy', role: 'Host', department: 'Service', date: '2026-05-21', startTime: '11:00', endTime: '19:00', status: 'confirmed', breakMinutes: 30 },
  { id: '8', employeeId: '8', employeeName: 'Sanjay Gupta', role: 'Busser', department: 'Service', date: '2026-05-21', startTime: '18:00', endTime: '23:00', status: 'scheduled', breakMinutes: 0 },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekDates = ['18', '19', '20', '21', '22', '23', '24'];

export default function ShiftsPage() {
  const [activeTab, setActiveTab] = useState<'shifts' | 'schedule' | 'attendance' | 'templates'>('shifts');
  const [selectedDept, setSelectedDept] = useState('All');
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState({
    employeeId: '',
    date: '2026-05-21',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
  });

  const filteredShifts = shifts.filter(
    (s) => selectedDept === 'All' || s.department === selectedDept
  );

  const stats = {
    active: shifts.filter((s) => s.status === 'in-progress').length,
    total: shifts.length,
    onTime: 6,
    late: 1,
    absent: 0,
  };

  const handleCreateShift = useCallback(() => {
    if (!newShift.employeeId) return;
    const employee = mockEmployees.find((e) => e.id === newShift.employeeId);
    if (!employee) return;

    const shift: Shift = {
      id: `${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      department: employee.department,
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      status: 'scheduled',
      breakMinutes: newShift.breakMinutes,
    };

    setShifts((prev) => [...prev, shift]);
    setShowCreateModal(false);
    setNewShift({ employeeId: '', date: '2026-05-21', startTime: '09:00', endTime: '17:00', breakMinutes: 30 });
  }, [newShift]);

  const handleUpdateStatus = useCallback((shiftId: string, status: Shift['status']) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, status } : s))
    );
  }, []);

  const handleDeleteShift = useCallback((shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    setSelectedShift(null);
  }, []);

  const handleApplyTemplate = useCallback((template: ShiftTemplate) => {
    setNewShift((prev) => ({
      ...prev,
      startTime: template.startTime,
      endTime: template.endTime,
      breakMinutes: template.breakMinutes,
    }));
  }, []);

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'confirmed': return styles.statusConfirmed;
      case 'in-progress': return styles.statusInProgress;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusScheduled;
    }
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const getScheduleForDay = (day: string) => {
    return shifts.filter((s) => {
      const dayIndex = weekDays.indexOf(day);
      const shiftDate = new Date(s.date);
      const today = new Date('2026-05-21');
      today.setDate(today.getDate() + dayIndex);
      return shiftDate.toDateString() === today.toDateString();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Shift Scheduling</h1>
          <p className={styles.subtitle}>Manage employee work schedules and track attendance</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setShowAssignModal(true)}>
            <span className={styles.btnIcon}>📋</span> Assign Template
          </button>
          <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
            <span className={styles.btnIcon}>+</span> Create Shift
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏱️</span>
          <div>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>Active Shifts</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Scheduled</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <span className={styles.statValue}>{stats.onTime}</span>
            <span className={styles.statLabel}>On Time</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏰</span>
          <div>
            <span className={styles.statValue}>{stats.late}</span>
            <span className={styles.statLabel}>Late</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>❌</span>
          <div>
            <span className={styles.statValue}>{stats.absent}</span>
            <span className={styles.statLabel}>Absent</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {(['shifts', 'schedule', 'attendance', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'shifts' && '📅 '}Shifts
              {tab === 'schedule' && '📆 '}Schedule
              {tab === 'attendance' && '✅ '}Attendance
              {tab === 'templates' && '📝 '}Templates
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <div className={styles.deptTabs}>
            {departments.map((dept) => (
              <button
                key={dept}
                className={`${styles.deptBtn} ${selectedDept === dept ? styles.deptBtnActive : ''}`}
                onClick={() => setSelectedDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'shifts' && (
        <div className={styles.shiftsList}>
          <div className={styles.listHeader}>
            <h2>Today's Shifts</h2>
            <span className={styles.count}>{filteredShifts.length} shifts</span>
          </div>
          <div className={styles.shiftsGrid}>
            {filteredShifts.map((shift) => (
              <div key={shift.id} className={styles.shiftCard} onClick={() => setSelectedShift(shift)}>
                <div className={styles.shiftHeader}>
                  <div className={styles.avatar}>
                    {shift.employeeName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className={styles.shiftInfo}>
                    <span className={styles.employeeName}>{shift.employeeName}</span>
                    <span className={styles.roleDept}>
                      {shift.role} · {shift.department}
                    </span>
                  </div>
                  <span className={`${styles.status} ${getStatusColor(shift.status)}`}>
                    {shift.status.replace('-', ' ')}
                  </span>
                </div>
                <div className={styles.shiftDetails}>
                  <div className={styles.timeSlot}>
                    <span className={styles.timeLabel}>⏰</span>
                    <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                  </div>
                  <div className={styles.breakSlot}>
                    <span className={styles.timeLabel}>☕</span>
                    <span>{shift.breakMinutes} min break</span>
                  </div>
                </div>
                <div className={styles.shiftActions}>
                  {shift.status === 'scheduled' && (
                    <>
                      <button
                        className={styles.confirmBtn}
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(shift.id, 'confirmed'); }}
                      >
                        ✓ Confirm
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(shift.id, 'cancelled'); }}
                      >
                        ✗ Cancel
                      </button>
                    </>
                  )}
                  {shift.status === 'confirmed' && (
                    <button
                      className={styles.startBtn}
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(shift.id, 'in-progress'); }}
                    >
                      ▶ Start
                    </button>
                  )}
                  {shift.status === 'in-progress' && (
                    <button
                      className={styles.completeBtn}
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(shift.id, 'completed'); }}
                    >
                      ✓ Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className={styles.scheduleView}>
          <div className={styles.weekHeader}>
            <div className={styles.weekNav}>
              <button className={styles.navBtn}>← Prev</button>
              <span className={styles.weekLabel}>May 18 - 24, 2026</span>
              <button className={styles.navBtn}>Next →</button>
            </div>
          </div>
          <div className={styles.weekGrid}>
            {weekDays.map((day, i) => (
              <div key={day} className={styles.dayColumn}>
                <div className={`${styles.dayHeader} ${i === 3 ? styles.today : ''}`}>
                  <span className={styles.dayName}>{day}</span>
                  <span className={styles.dayDate}>{weekDates[i]}</span>
                </div>
                <div className={styles.dayShifts}>
                  {getScheduleForDay(day).map((shift) => (
                    <div key={shift.id} className={styles.scheduleShift}>
                      <span className={styles.scheduleTime}>{formatTime(shift.startTime)}</span>
                      <span className={styles.scheduleName}>{shift.employeeName}</span>
                      <span className={styles.scheduleRole}>{shift.role}</span>
                    </div>
                  ))}
                  {getScheduleForDay(day).length === 0 && (
                    <div className={styles.noShifts}>No shifts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className={styles.attendanceView}>
          <div className={styles.listHeader}>
            <h2>Live Attendance</h2>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              Live
            </div>
          </div>
          <div className={styles.attendanceTable}>
            <div className={styles.tableHeader}>
              <span>Employee</span>
              <span>Check In</span>
              <span>Check Out</span>
              <span>Hours</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filteredShifts.filter(s => s.status === 'in-progress' || s.status === 'completed').map((shift) => (
              <div key={shift.id} className={styles.tableRow}>
                <div className={styles.empCell}>
                  <div className={styles.smallAvatar}>
                    {shift.employeeName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <span className={styles.empName}>{shift.employeeName}</span>
                    <span className={styles.empRole}>{shift.role}</span>
                  </div>
                </div>
                <span>{shift.status === 'in-progress' ? formatTime(shift.startTime) : formatTime(shift.startTime)}</span>
                <span>{shift.status === 'completed' ? formatTime(shift.endTime) : '--:--'}</span>
                <span>
                  {shift.status === 'completed'
                    ? `${Math.round((new Date(`2026-05-21T${shift.endTime}`).getTime() - new Date(`2026-05-21T${shift.startTime}`).getTime()) / 3600000 - shift.breakMinutes / 60).toFixed(1)}h`
                    : 'In progress'}
                </span>
                <span className={`${styles.status} ${getStatusColor(shift.status)}`}>
                  {shift.status.replace('-', ' ')}
                </span>
                <div className={styles.rowActions}>
                  {shift.status === 'in-progress' && (
                    <button className={styles.outBtn}>Check Out</button>
                  )}
                  <button className={styles.viewBtn}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className={styles.templatesView}>
          <div className={styles.listHeader}>
            <h2>Shift Templates</h2>
            <button className={styles.addTemplateBtn}>+ Add Template</button>
          </div>
          <div className={styles.templatesGrid}>
            {shiftTemplates.map((template) => (
              <div key={template.id} className={styles.templateCard}>
                <div className={styles.templateHeader}>
                  <span className={styles.templateName}>{template.name}</span>
                  <span className={styles.templateDuration}>
                    {Math.round((new Date(`2026-05-21T${template.endTime}`).getTime() - new Date(`2026-05-21T${template.startTime}`).getTime()) / 3600000)}h
                  </span>
                </div>
                <div className={styles.templateTimes}>
                  <span>{formatTime(template.startTime)} - {formatTime(template.endTime)}</span>
                </div>
                <div className={styles.templateBreak}>
                  ☕ {template.breakMinutes} min break
                </div>
                <div className={styles.templateActions}>
                  <button
                    className={styles.applyBtn}
                    onClick={() => {
                      handleApplyTemplate(template);
                      setShowCreateModal(true);
                    }}
                  >
                    Use Template
                  </button>
                  <button className={styles.editBtn}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Create New Shift</h2>
            <div className={styles.formGroup}>
              <label>Employee</label>
              <select
                value={newShift.employeeId}
                onChange={(e) => setNewShift((prev) => ({ ...prev, employeeId: e.target.value }))}
              >
                <option value="">Select Employee</option>
                {mockEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role} ({emp.department})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Date</label>
              <input
                type="date"
                value={newShift.date}
                onChange={(e) => setNewShift((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className={styles.timeRow}>
              <div className={styles.formGroup}>
                <label>Start Time</label>
                <input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>End Time</label>
                <input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Break Duration (minutes)</label>
              <select
                value={newShift.breakMinutes}
                onChange={(e) => setNewShift((prev) => ({ ...prev, breakMinutes: Number(e.target.value) }))}
              >
                <option value={0}>No break</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleCreateShift}>Create Shift</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Assign Template to Employee</h2>
            <div className={styles.formGroup}>
              <label>Select Template</label>
              <div className={styles.templateOptions}>
                {shiftTemplates.map((t) => (
                  <button
                    key={t.id}
                    className={styles.templateOption}
                    onClick={() => handleApplyTemplate(t)}
                  >
                    <span className={styles.templateOptName}>{t.name}</span>
                    <span className={styles.templateOptTime}>{formatTime(t.startTime)} - {formatTime(t.endTime)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Select Employees</label>
              <div className={styles.employeeList}>
                {mockEmployees.map((emp) => (
                  <label key={emp.id} className={styles.employeeCheckbox}>
                    <input type="checkbox" />
                    <div className={styles.checkboxAvatar}>{emp.avatar}</div>
                    <div>
                      <span className={styles.checkboxName}>{emp.name}</span>
                      <span className={styles.checkboxRole}>{emp.role} · {emp.department}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Days to Apply</label>
              <div className={styles.daysCheckboxes}>
                {weekDays.map((day) => (
                  <label key={day} className={styles.dayCheckbox}>
                    <input type="checkbox" defaultChecked />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={() => setShowAssignModal(false)}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {selectedShift && (
        <div className={styles.modal} onClick={() => setSelectedShift(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Shift Details</h2>
            <div className={styles.detailSection}>
              <div className={styles.detailHeader}>
                <div className={styles.largeAvatar}>
                  {selectedShift.employeeName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3>{selectedShift.employeeName}</h3>
                  <p>{selectedShift.role} · {selectedShift.department}</p>
                </div>
              </div>
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span>Date</span>
                  <span>{selectedShift.date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Time</span>
                  <span>{formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Break</span>
                  <span>{selectedShift.breakMinutes} minutes</span>
                </div>
                <div className={styles.detailRow}>
                  <span>Status</span>
                  <span className={`${styles.status} ${getStatusColor(selectedShift.status)}`}>
                    {selectedShift.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.deleteBtn} onClick={() => handleDeleteShift(selectedShift.id)}>Delete</button>
              <button className={styles.cancelBtn} onClick={() => setSelectedShift(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
