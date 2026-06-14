'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Square, Calendar, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function Timecard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [currentSessionStart] = useState('09:00');
  
  const currentWeek = [
    {
      date: '2024-01-08',
      day: 'Monday',
      clockIn: '09:00',
      clockOut: '17:30',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 7.5,
      overtime: 0,
      status: 'completed'
    },
    {
      date: '2024-01-09',
      day: 'Tuesday',
      clockIn: '09:15',
      clockOut: '18:00',
      breakStart: '13:30',
      breakEnd: '14:30',
      totalHours: 7.75,
      overtime: 0,
      status: 'completed'
    },
    {
      date: '2024-01-10',
      day: 'Wednesday',
      clockIn: '08:45',
      clockOut: '17:45',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 8,
      overtime: 0,
      status: 'completed'
    },
    {
      date: '2024-01-11',
      day: 'Thursday',
      clockIn: '09:00',
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalHours: 0,
      overtime: 0,
      status: 'in_progress'
    }
  ];

  const lastWeek = [
    {
      date: '2024-01-01',
      day: 'Monday',
      clockIn: '09:00',
      clockOut: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 8,
      overtime: 0,
      status: 'completed'
    },
    {
      date: '2024-01-02',
      day: 'Tuesday',
      clockIn: '08:30',
      clockOut: '18:30',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 9,
      overtime: 1,
      status: 'completed'
    },
    {
      date: '2024-01-03',
      day: 'Wednesday',
      clockIn: '09:00',
      clockOut: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 7,
      overtime: 0,
      status: 'completed'
    },
    {
      date: '2024-01-04',
      day: 'Thursday',
      clockIn: '09:15',
      clockOut: '19:00',
      breakStart: '13:30',
      breakEnd: '14:30',
      totalHours: 8.75,
      overtime: 0.75,
      status: 'completed'
    },
    {
      date: '2024-01-05',
      day: 'Friday',
      clockIn: '09:00',
      clockOut: '20:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      totalHours: 10,
      overtime: 2,
      status: 'completed'
    }
  ];

  const timesheet = selectedPeriod === 'current' ? currentWeek : lastWeek;

  const calculateTotals = () => {
    return timesheet.reduce((totals, day) => ({
      totalHours: totals.totalHours + day.totalHours,
      overtime: totals.overtime + day.overtime,
      workDays: totals.workDays + (day.status === 'completed' ? 1 : 0)
    }), { totalHours: 0, overtime: 0, workDays: 0 });
  };

  const totals = calculateTotals();

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateCurrentHours = () => {
    if (!isCurrentlyWorking) return 0;
    const start = new Date(`1970-01-01T${currentSessionStart}`);
    const now = new Date();
    const current = new Date(`1970-01-01T${getCurrentTime()}`);
    return (current.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleClockInOut = () => {
    setIsCurrentlyWorking(!isCurrentlyWorking);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'late': return 'bg-yellow-500';
      case 'missing': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Timecard</h1>
            <p className="text-muted-foreground">Track your work hours and attendance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="last">Last Week</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Clock In/Out */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Current Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{getCurrentTime()}</div>
                      <div className="text-sm text-gray-600">
                        {isCurrentlyWorking 
                          ? `Started at ${currentSessionStart} • ${calculateCurrentHours().toFixed(1)} hours`
                          : 'Not currently working'
                        }
                      </div>
                    </div>
                    <Button 
                      onClick={handleClockInOut}
                      size="lg"
                      className={isCurrentlyWorking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                    >
                      {isCurrentlyWorking ? (
                        <>
                          <Square className="h-5 w-5 mr-2" />
                          Clock Out
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Clock In
                        </>
                      )}
                    </Button>
                  </div>
                  {isCurrentlyWorking && (
                    <div className="mt-4">
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Remember to take your break after 4 hours of work.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Timesheet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Weekly Timesheet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timesheet.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="font-semibold">{day.day}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(day.date).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className={getStatusColor(day.status)}>
                              {day.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-6 text-sm">
                            <div>
                              <div className="text-gray-500">Clock In</div>
                              <div className="font-medium">{day.clockIn || '--'}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Clock Out</div>
                              <div className="font-medium">{day.clockOut || '--'}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Break</div>
                              <div className="font-medium">
                                {day.breakStart && day.breakEnd 
                                  ? `${day.breakStart}-${day.breakEnd}` 
                                  : '--'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Total Hours</div>
                              <div className="font-medium">
                                {day.totalHours.toFixed(1)}h
                                {day.overtime > 0 && (
                                  <span className="text-blue-600 ml-1">
                                    (+{day.overtime.toFixed(1)} OT)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {totals.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                    <Progress value={(totals.totalHours / 40) * 100} className="mt-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {((totals.totalHours / 40) * 100).toFixed(0)}% of 40h target
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Regular Hours</span>
                      <span className="font-medium">
                        {(totals.totalHours - totals.overtime).toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Hours</span>
                      <span className="font-medium text-blue-600">
                        {totals.overtime.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Work Days</span>
                      <span className="font-medium">{totals.workDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Hours/Day</span>
                      <span className="font-medium">
                        {totals.workDays > 0 ? (totals.totalHours / totals.workDays).toFixed(1) : '0'}h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Attendance Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Hours</span>
                    <span className="font-medium">156.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Worked</span>
                    <span className="font-medium">19</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On-Time Arrival</span>
                    <span className="font-medium text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Hours</span>
                    <span className="font-medium text-blue-600">12.5h</span>
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
                    Request Time Off
                  </Button>
                  <Button variant="outline" className="w-full">
                    Report Issue
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Pay Stub
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Time Tracking Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div>• Clock in within 5 minutes of your scheduled start time</div>
                  <div>• Take your required break after 4 hours</div>
                  <div>• Clock out before leaving the premises</div>
                  <div>• Report unknown timecard issues immediately</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}