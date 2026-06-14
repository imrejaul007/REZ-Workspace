'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function EmployeeAttendance() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track your work attendance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">22</p>
              <p className="text-sm text-muted-foreground">Days This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">20</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">176</p>
              <p className="text-sm text-muted-foreground">Hours</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}