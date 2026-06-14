'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function VendorAnalytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Business insights and reports</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Business Analytics</h3>
            <p className="text-muted-foreground">View sales analytics and performance metrics</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
