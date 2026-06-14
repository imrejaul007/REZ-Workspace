'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';

const DEAL_TABS = ['all', 'active', 'flash', 'weekend', 'new-user'] as const;

function EmptyDealsState({ tab }: { tab: string }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-muted rounded-full">
          <Zap className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">No deals available</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
        {tab === 'active'
          ? 'There are no active deals at the moment. Check back soon!'
          : tab === 'flash'
          ? 'No flash sales are running right now.'
          : tab === 'weekend'
          ? 'No weekend deals this week.'
          : tab === 'new-user'
          ? 'No new user offers available at this time.'
          : 'Deals and special offers will appear here when suppliers and vendors post them.'}
      </p>
    </Card>
  );
}

export default function DealsPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <div className="text-sm text-muted-foreground">
            <span
              className="cursor-pointer hover:text-foreground"
              onClick={() => router.push('/marketplace')}
            >
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>Flash Deals</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Flash Deals & Special Offers
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Limited time offers with savings on your favourite supplies
            </p>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Deals</TabsTrigger>
            <TabsTrigger value="active">Active Now</TabsTrigger>
            <TabsTrigger value="flash">Flash Sales</TabsTrigger>
            <TabsTrigger value="weekend">Weekend</TabsTrigger>
            <TabsTrigger value="new-user">New User</TabsTrigger>
          </TabsList>

          {DEAL_TABS.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyDealsState tab={tab} />
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Subscribe CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center text-white"
        >
          <Bell className="h-8 w-8 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Never Miss a Deal!</h2>
          <p className="mb-6">Subscribe to get notified when flash sales and exclusive offers go live.</p>
          <div className="flex items-center space-x-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg text-black"
            />
            <Button variant="secondary">Subscribe</Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
