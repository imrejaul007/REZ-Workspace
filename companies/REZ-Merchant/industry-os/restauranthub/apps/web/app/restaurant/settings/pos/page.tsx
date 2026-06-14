'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CreditCard,
  Smartphone,
  Settings,
  Shield,
  Zap,
  Plug,
  Plus,
  FileText,
  Download,
  Upload,
} from 'lucide-react';

interface NewProviderForm {
  name: string;
  apiKey: string;
  secretKey: string;
  environment: string;
}

interface NewTerminalForm {
  name: string;
  location: string;
  type: string;
  ipAddress: string;
}

export default function POSIntegrationSettings() {
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddTerminalOpen, setIsAddTerminalOpen] = useState(false);

  const [newProvider, setNewProvider] = useState<NewProviderForm>({
    name: '',
    apiKey: '',
    secretKey: '',
    environment: 'sandbox',
  });

  const [newTerminal, setNewTerminal] = useState<NewTerminalForm>({
    name: '',
    location: '',
    type: 'main',
    ipAddress: '',
  });

  const handleConnectProvider = () => {
    // TODO: wire to POST /pos/providers once backend is ready
    setNewProvider({ name: '', apiKey: '', secretKey: '', environment: 'sandbox' });
    setIsAddProviderOpen(false);
  };

  const handleAddTerminal = () => {
    // TODO: wire to POST /pos/terminals once backend is ready
    setNewTerminal({ name: '', location: '', type: 'main', ipAddress: '' });
    setIsAddTerminalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POS Integration Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure and manage your Point of Sale system integrations
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Config
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">POS Providers</TabsTrigger>
            <TabsTrigger value="terminals">Terminals</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* POS Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Connected Providers</h2>
              <Dialog open={isAddProviderOpen} onOpenChange={setIsAddProviderOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add POS Provider</DialogTitle>
                    <DialogDescription>
                      Connect a new POS system to your restaurant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        value={newProvider.name}
                        onChange={(e) => setNewProvider((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Square, Toast, Clover"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider((prev) => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secret-key">Secret Key</Label>
                      <Input
                        id="secret-key"
                        type="password"
                        value={newProvider.secretKey}
                        onChange={(e) => setNewProvider((prev) => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Enter secret key"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleConnectProvider} className="flex-1">
                        Connect Provider
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddProviderOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Empty state — no POS connected */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Plug className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No POS system connected</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Connect your Point of Sale system to sync orders, payments, and inventory automatically.
                    </p>
                  </div>
                  <Button onClick={() => setIsAddProviderOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect your POS system
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Terminals Tab */}
          <TabsContent value="terminals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">POS Terminals</h2>
              <Dialog open={isAddTerminalOpen} onOpenChange={setIsAddTerminalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Terminal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add POS Terminal</DialogTitle>
                    <DialogDescription>Register a new terminal device</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="terminal-name">Terminal Name</Label>
                      <Input
                        id="terminal-name"
                        value={newTerminal.name}
                        onChange={(e) => setNewTerminal((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Main Counter, Waiter Station"
                      />
                    </div>
                    <div>
                      <Label htmlFor="terminal-location">Location</Label>
                      <Input
                        id="terminal-location"
                        value={newTerminal.location}
                        onChange={(e) => setNewTerminal((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Front Desk, Kitchen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="terminal-ip">IP Address</Label>
                      <Input
                        id="terminal-ip"
                        value={newTerminal.ipAddress}
                        onChange={(e) => setNewTerminal((prev) => ({ ...prev, ipAddress: e.target.value }))}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleAddTerminal} className="flex-1">
                        Add Terminal
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddTerminalOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Empty state — no terminals */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-muted rounded-full">
                    <CreditCard className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No terminals registered</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Register your POS terminal devices to monitor their status and activity.
                    </p>
                  </div>
                  <Button onClick={() => setIsAddTerminalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Terminal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable API Encryption</Label>
                      <p className="text-sm text-muted-foreground">Encrypt all API communications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require auth for all requests</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log All Transactions</Label>
                      <p className="text-sm text-muted-foreground">Keep detailed transaction logs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Performance Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                    <Input id="sync-interval" type="number" defaultValue="5" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                    <Input id="timeout" type="number" defaultValue="30" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="retry-attempts">Retry Attempts</Label>
                    <Input id="retry-attempts" type="number" defaultValue="3" className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Monitor POS integration activity and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Settings className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground">
                    Activity logs will appear here once a POS system is connected.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
