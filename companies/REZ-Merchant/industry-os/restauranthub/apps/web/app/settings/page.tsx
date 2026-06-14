'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  Phone,
  Lock,
  Key,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { SessionManager } from '@/components/auth/session-manager';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+91 98765 43210',
    bio: 'Restaurant owner passionate about great food and customer service.',
    avatar: '/avatars/john.jpg'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true,
    instantMessages: true
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    dataSharing: false,
    activityTracking: true
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: (user as unknown)?.twoFactorEnabled || false,
    sessionTimeout: '15',
    loginAlerts: true,
    deviceManagement: true
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
  };

  const handle2FAToggle = (checked: boolean) => {
    if (checked) {
      // Enable 2FA - show setup dialog
      setShow2FASetup(true);
    } else {
      // Show confirmation before disabling
      setShow2FADisableConfirm(true);
    }
  };

  const handleConfirmDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/2fa`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to disable 2FA');
      }
      setSecurity({ ...security, twoFactorAuth: false });
      setShow2FADisableConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      // Surface error without crashing
      console.error('Disable 2FA error:', err instanceof Error ? err.message : String(err));
    } finally {
      setDisabling2FA(false);
    }
  };

  const handle2FASetupSuccess = () => {
    setSecurity({ ...security, twoFactorAuth: true });
    setShow2FASetup(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handle2FASetupClose = () => {
    setShow2FASetup(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <Settings className="h-8 w-8 mr-3 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {saveSuccess && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your settings have been saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback>
                      {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="default">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF, max 5MB
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Input
                      id="role"
                      value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Restaurant'}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Saving...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how RestoPapa looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred theme
                    </p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Monitor className="h-4 w-4 mr-2" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onChange={() =>
                        setNotifications({ ...notifications, emailNotifications: !notifications.emailNotifications })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onChange={() => 
                        setNotifications({ ...notifications, pushNotifications: !notifications.pushNotifications })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onChange={() => 
                        setNotifications({ ...notifications, smsNotifications: !notifications.smsNotifications })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Order Updates</Label>
                    <Switch
                      checked={notifications.orderUpdates}
                      onChange={() => 
                        setNotifications({ ...notifications, orderUpdates: !notifications.orderUpdates })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Marketing Emails</Label>
                    <Switch
                      checked={notifications.marketingEmails}
                      onChange={() => 
                        setNotifications({ ...notifications, marketingEmails: !notifications.marketingEmails })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Security Alerts</Label>
                    <Switch
                      checked={notifications.securityAlerts}
                      onChange={() => 
                        setNotifications({ ...notifications, securityAlerts: !notifications.securityAlerts })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Weekly Reports</Label>
                    <Switch
                      checked={notifications.weeklyReports}
                      onChange={() => 
                        setNotifications({ ...notifications, weeklyReports: !notifications.weeklyReports })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select 
                      value={privacy.profileVisibility}
                      onValueChange={(value) => 
                        setPrivacy({ ...privacy, profileVisibility: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Email Address</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your email on your profile
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onChange={() => 
                        setPrivacy({ ...privacy, showEmail: !privacy.showEmail })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others send you direct messages
                      </p>
                    </div>
                    <Switch
                      checked={privacy.allowMessages}
                      onChange={() => 
                        setPrivacy({ ...privacy, allowMessages: !privacy.allowMessages })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Share data with partners for improved services
                      </p>
                    </div>
                    <Switch
                      checked={privacy.dataSharing}
                      onChange={() => 
                        setPrivacy({ ...privacy, dataSharing: !privacy.dataSharing })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Data Management</h3>
                  
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Download Your Data
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" className="w-full justify-between text-destructive">
                    <span className="flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                      {security.twoFactorAuth && (
                        <div className="flex items-center space-x-2 mt-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Enabled</span>
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={security.twoFactorAuth}
                      onCheckedChange={handle2FAToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new login attempts
                      </p>
                    </div>
                    <Switch
                      checked={security.loginAlerts}
                      onChange={() => 
                        setSecurity({ ...security, loginAlerts: !security.loginAlerts })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select 
                      value={security.sessionTimeout}
                      onValueChange={(value) => 
                        setSecurity({ ...security, sessionTimeout: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Session Management</h3>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setShowSessionManager(true)}
                    >
                      View All Sessions
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions across all devices
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Professional Plan</h3>
                      <p className="text-sm text-muted-foreground">₹2,999/month</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>Next billing date: February 15, 2024</p>
                    <p>Payment method: •••• 4242</p>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="default">Change Plan</Button>
                    <Button variant="outline" size="default">Cancel Subscription</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Payment Methods</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <Badge variant="outline">Default</Badge>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Add Payment Method
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Billing History</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">January 2024</p>
                        <p className="text-sm text-muted-foreground">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹2,999</p>
                        <Button variant="link" size="default" className="p-0 h-auto">
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Section */}
        <Card>
          <CardContent className="p-6">
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
          <DialogContent className="max-w-md">
            <TwoFactorSetup
              onClose={handle2FASetupClose}
              onSuccess={handle2FASetupSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Session Manager Dialog */}
        <Dialog open={showSessionManager} onOpenChange={setShowSessionManager}>
          <DialogContent className="max-w-4xl">
            <SessionManager />
          </DialogContent>
        </Dialog>

        {/* 2FA Disable Confirmation Dialog */}
        <Dialog open={show2FADisableConfirm} onOpenChange={setShow2FADisableConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable 2FA? This will make your account less secure.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShow2FADisableConfirm(false)}
                disabled={disabling2FA}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDisable2FA}
                disabled={disabling2FA}
              >
                {disabling2FA ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}