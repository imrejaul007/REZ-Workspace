'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Award, PlayCircle, TrendingUp } from 'lucide-react';

export default function EmployeeLearning() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Hub</h1>
          <p className="text-muted-foreground mt-1">Enhance your skills and knowledge</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Courses</h3>
              <p className="text-sm text-muted-foreground">Available learning modules</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-gold-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Certifications</h3>
              <p className="text-sm text-muted-foreground">Earn industry certificates</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <PlayCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Videos</h3>
              <p className="text-sm text-muted-foreground">Training video library</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Progress</h3>
              <p className="text-sm text-muted-foreground">Track your learning</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}