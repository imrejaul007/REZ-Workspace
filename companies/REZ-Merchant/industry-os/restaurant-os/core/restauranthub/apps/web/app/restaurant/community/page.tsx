'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, TrendingUp } from 'lucide-react';

export default function RestaurantCommunity() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-1">
            Connect with other restaurants and share experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Discussions</h3>
              <p className="text-sm text-muted-foreground">Join restaurant discussions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Network</h3>
              <p className="text-sm text-muted-foreground">Connect with peers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Trends</h3>
              <p className="text-sm text-muted-foreground">Industry insights</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}