'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function VendorOrders() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Order Management</h3>
            <p className="text-muted-foreground">Track and process customer orders</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
