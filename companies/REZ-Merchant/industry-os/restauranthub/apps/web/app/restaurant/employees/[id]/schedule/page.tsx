'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Clock, Calendar, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EmployeeSchedule() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [employee] = useState({
    id: employeeId,
    name: 'Sarah Johnson',
    role: 'Server'
  });

  const [schedule, setSchedule] = useState({
    monday: { start: '10:00', end: '18:00', off: false, break: '14:00-15:00' },
    tuesday: { start: '10:00', end: '18:00', off: false, break: '14:00-15:00' },
    wednesday: { start: '10:00', end: '18:00', off: false, break: '14:00-15:00' },
    thursday: { start: '10:00', end: '18:00', off: false, break: '14:00-15:00' },
    friday: { start: '09:00', end: '17:00', off: false, break: '13:00-14:00' },
    saturday: { start: '09:00', end: '17:00', off: false, break: '13:00-14:00' },
    sunday: { start: '', end: '', off: true, break: '' }
  });

  const [weeklyHours, setWeeklyHours] = useState(40);
  const [loading, setLoading] = useState(false);

  const handleScheduleChange = (day: string, field: string, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const copySchedule = (fromDay: string, toDay: string) => {
    const sourceSchedule = schedule[fromDay as keyof typeof schedule];
    setSchedule(prev => ({
      ...prev,
      [toDay]: { ...sourceSchedule }
    }));
  };

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  };

  const getTotalWeeklyHours = () => {
    return Object.entries(schedule).reduce((total, [day, hours]) => {
      if (hours.off) return total;
      return total + calculateHours(hours.start, hours.end);
    }, 0);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/restaurant/employees/${employeeId}`);
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const presetSchedules = [
    { name: 'Full Time (40h)', schedule: { start: '09:00', end: '17:00', break: '13:00-14:00' } },
    { name: 'Part Time (20h)', schedule: { start: '14:00', end: '18:00', break: '' } },
    { name: 'Evening Shift', schedule: { start: '17:00', end: '23:00', break: '20:00-20:30' } },
    { name: 'Weekend Only', schedule: { start: '10:00', end: '18:00', break: '14:00-15:00' } }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost"  onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employee
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Manage Schedule</h1>
              <p className="text-muted-foreground">{employee.name} • {employee.role}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Weekly Schedule
                    </CardTitle>
                    <Badge variant="outline">
                      {getTotalWeeklyHours().toFixed(1)} hours/week
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(schedule).map(([day, hours]) => (
                      <div key={day} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-24">
                              <span className="font-medium capitalize">{day}</span>
                            </div>
                            <Checkbox
                              id={`${day}-off`}
                              checked={hours.off}
                              onChange={(e) => handleScheduleChange(day, 'off', (e.target as HTMLInputElement).checked)}
                            />
                            <Label htmlFor={`${day}-off`} className="text-sm">Off</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select onValueChange={(value) => copySchedule(value, day)}>
                              <SelectTrigger className="w-24">
                                <Copy className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(schedule).filter(d => d !== day).map(otherDay => (
                                  <SelectItem key={otherDay} value={otherDay}>
                                    {otherDay}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {!hours.off && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-28">
                            <div>
                              <Label className="text-xs text-gray-500">Start Time</Label>
                              <Input
                                type="time"
                                value={hours.start}
                                onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">End Time</Label>
                              <Input
                                type="time"
                                value={hours.end}
                                onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Break Time</Label>
                              <Input
                                placeholder="13:00-14:00"
                                value={hours.break}
                                onChange={(e) => handleScheduleChange(day, 'break', e.target.value)}
                              />
                            </div>
                            <div className="md:col-span-3 text-right">
                              <span className="text-sm text-gray-500">
                                Daily Hours: {calculateHours(hours.start, hours.end).toFixed(1)}h
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Schedule Templates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {presetSchedules.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => {
                          const newSchedule = { ...schedule };
                          Object.keys(newSchedule).forEach(day => {
                            if (preset.name === 'Weekend Only' && !['saturday', 'sunday'].includes(day)) {
                              newSchedule[day as keyof typeof newSchedule] = { 
                                start: '', end: '', off: true, break: '' 
                              };
                            } else if (preset.name !== 'Weekend Only' || ['saturday', 'sunday'].includes(day)) {
                              newSchedule[day as keyof typeof newSchedule] = { 
                                ...preset.schedule, off: false 
                              };
                            }
                          });
                          setSchedule(newSchedule);
                        }}
                        className="justify-start"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Hours</span>
                    <span className="font-semibold">{getTotalWeeklyHours().toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Working Days</span>
                    <span className="font-semibold">
                      {Object.values(schedule).filter(s => !s.off).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days Off</span>
                    <span className="font-semibold">
                      {Object.values(schedule).filter(s => s.off).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={getTotalWeeklyHours() >= 35 ? "default" : "secondary"}>
                      {getTotalWeeklyHours() >= 35 ? 'Full Time' : 'Part Time'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Schedule Rules */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">Maximum Hours</div>
                    <div className="text-blue-700">40 hours per week</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">Minimum Break</div>
                    <div className="text-green-700">30 minutes for 6+ hour shifts</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-900">Overtime</div>
                    <div className="text-yellow-700">Applies after 40 hours/week</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    View Time Clock
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule History
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}