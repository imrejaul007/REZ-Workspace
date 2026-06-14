'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function VendorCommunity() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-1">Connect with other vendors</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Vendor Community</h3>
            <p className="text-muted-foreground">Network with fellow vendors</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
