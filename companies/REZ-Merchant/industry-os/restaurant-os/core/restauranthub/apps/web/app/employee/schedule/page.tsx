'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, MapPin, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function EmployeeSchedule() {
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [requestMessage, setRequestMessage] = useState('');
  
  const currentWeek = [
    {
      date: '2024-01-10',
      day: 'Monday',
      shift: { start: '10:00', end: '18:00', position: 'Server', location: 'Main Dining' },
      status: 'scheduled',
      break: '14:00-15:00'
    },
    {
      date: '2024-01-11',
      day: 'Tuesday',
      shift: { start: '10:00', end: '18:00', position: 'Server', location: 'Main Dining' },
      status: 'scheduled',
      break: '14:00-15:00'
    },
    {
      date: '2024-01-12',
      day: 'Wednesday',
      shift: { start: '10:00', end: '18:00', position: 'Server', location: 'Patio' },
      status: 'scheduled',
      break: '14:00-15:00'
    },
    {
      date: '2024-01-13',
      day: 'Thursday',
      shift: null,
      status: 'off',
      break: null
    },
    {
      date: '2024-01-14',
      day: 'Friday',
      shift: { start: '16:00', end: '22:00', position: 'Server', location: 'Main Dining' },
      status: 'scheduled',
      break: '19:00-19:30'
    },
    {
      date: '2024-01-15',
      day: 'Saturday',
      shift: { start: '14:00', end: '22:00', position: 'Server', location: 'Bar Area' },
      status: 'scheduled',
      break: '18:00-18:30'
    },
    {
      date: '2024-01-16',
      day: 'Sunday',
      shift: null,
      status: 'off',
      break: null
    }
  ];

  const nextWeek = [
    {
      date: '2024-01-17',
      day: 'Monday',
      shift: { start: '09:00', end: '17:00', position: 'Server', location: 'Main Dining' },
      status: 'tentative',
      break: '13:00-14:00'
    },
    {
      date: '2024-01-18',
      day: 'Tuesday',
      shift: null,
      status: 'requested_off',
      break: null
    },
    {
      date: '2024-01-19',
      day: 'Wednesday',
      shift: { start: '12:00', end: '20:00', position: 'Server', location: 'Patio' },
      status: 'tentative',
      break: '16:00-16:30'
    },
    {
      date: '2024-01-20',
      day: 'Thursday',
      shift: { start: '10:00', end: '18:00', position: 'Host', location: 'Front Desk' },
      status: 'tentative',
      break: '14:00-15:00'
    },
    {
      date: '2024-01-21',
      day: 'Friday',
      shift: { start: '17:00', end: '23:00', position: 'Server', location: 'Main Dining' },
      status: 'tentative',
      break: '20:00-20:30'
    },
    {
      date: '2024-01-22',
      day: 'Saturday',
      shift: { start: '15:00', end: '23:00', position: 'Server', location: 'Bar Area' },
      status: 'tentative',
      break: '19:00-19:30'
    },
    {
      date: '2024-01-23',
      day: 'Sunday',
      shift: null,
      status: 'off',
      break: null
    }
  ];

  const schedule = selectedWeek === 'current' ? currentWeek : nextWeek;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-500';
      case 'tentative': return 'bg-yellow-500';
      case 'requested_off': return 'bg-blue-500';
      case 'off': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <CheckCircle className="h-4 w-4" />;
      case 'tentative': return <AlertCircle className="h-4 w-4" />;
      case 'requested_off': return <Clock className="h-4 w-4" />;
      case 'off': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const calculateWeeklyHours = () => {
    return schedule.reduce((total, day) => {
      if (day.shift && day.status !== 'off') {
        const start = new Date(`1970-01-01T${day.shift.start}`);
        const end = new Date(`1970-01-01T${day.shift.end}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      return total;
    }, 0);
  };

  const requestTimeOff = () => {
    console.log('Time off request:', requestMessage);
    setRequestMessage('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">View and manage your work schedule</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Time Off
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Time Off</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="message">Reason (optional)</Label>
                    <Textarea
                      id="message"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Please provide a reason for your time off request..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={requestTimeOff} className="w-full">
                    Submit Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Schedule Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{calculateWeeklyHours().toFixed(1)}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {schedule.filter(d => d.status === 'scheduled' || d.status === 'tentative').length}
                </div>
                <div className="text-sm text-gray-600">Work Days</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {schedule.filter(d => d.status === 'off' || d.status === 'requested_off').length}
                </div>
                <div className="text-sm text-gray-600">Days Off</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Schedule Alert */}
        {selectedWeek === 'next' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Next week's schedule is tentative and may change. Final schedule will be posted by Friday.
            </AlertDescription>
          </Alert>
        )}

        {/* Weekly Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Week of {new Date(schedule[0].date).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((day, index) => (
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
                            {new Date(day.date).getDate()}
                          </div>
                        </div>
                        <Badge className={getStatusColor(day.status)}>
                          {getStatusIcon(day.status)}
                          <span className="ml-1 capitalize">{day.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      {day.shift ? (
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {day.shift.start} - {day.shift.end}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{day.shift.position}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{day.shift.location}</span>
                          </div>
                          {day.break && (
                            <div className="text-xs text-gray-500 mt-2">
                              Break: {day.break}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          {day.status === 'requested_off' ? 'Time off requested' : 'Day off'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Schedule Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Scheduled</Badge>
                  <span>Confirmed shifts that you're expected to work</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500">Tentative</Badge>
                  <span>Proposed shifts that may still change</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500">Requested Off</Badge>
                  <span>Days where you've requested time off</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gray-400">Off</Badge>
                  <span>Regular days off</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}