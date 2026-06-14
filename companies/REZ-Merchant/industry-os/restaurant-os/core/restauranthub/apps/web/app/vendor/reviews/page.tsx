'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function VendorReviews() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground mt-1">Customer feedback and ratings</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Customer Reviews</h3>
            <p className="text-muted-foreground">View and manage customer reviews</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
