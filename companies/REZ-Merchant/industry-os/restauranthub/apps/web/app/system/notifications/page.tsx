'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Check,
  X,
  Filter,
  Search,
  MoreVertical,
  Mail,
  Smartphone,
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function NotificationsCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #ORD-2024-001 from John Doe - $67.47',
      type: 'order',
      status: 'unread',
      timestamp: '2024-02-15T14:30:00',
      priority: 'high',
      actionRequired: true,
      metadata: { orderId: 'ORD-2024-001', amount: 67.47 }
    },
    {
      id: 2,
      title: 'Payment Successful',
      message: 'Payment for order #ORD-2024-002 has been processed successfully',
      type: 'payment',
      status: 'read',
      timestamp: '2024-02-15T13:45:00',
      priority: 'medium',
      actionRequired: false,
      metadata: { orderId: 'ORD-2024-002', amount: 45.80 }
    },
    {
      id: 3,
      title: 'Low Inventory Alert',
      message: 'Tomatoes stock is running low (5 units remaining)',
      type: 'inventory',
      status: 'unread',
      timestamp: '2024-02-15T12:20:00',
      priority: 'high',
      actionRequired: true,
      metadata: { item: 'Tomatoes', quantity: 5 }
    },
    {
      id: 4,
      title: 'Customer Review',
      message: 'New 5-star review from Sarah Wilson for Tokyo Sushi Bar',
      type: 'review',
      status: 'read',
      timestamp: '2024-02-15T11:15:00',
      priority: 'low',
      actionRequired: false,
      metadata: { rating: 5, restaurant: 'Tokyo Sushi Bar' }
    },
    {
      id: 5,
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2:00 AM - 4:00 AM EST',
      type: 'system',
      status: 'read',
      timestamp: '2024-02-15T09:00:00',
      priority: 'medium',
      actionRequired: false,
      metadata: { maintenanceWindow: '2:00 AM - 4:00 AM EST' }
    },
    {
      id: 6,
      title: 'Employee Schedule Update',
      message: 'Mike Johnson has requested time off for March 1-3',
      type: 'staff',
      status: 'unread',
      timestamp: '2024-02-15T08:30:00',
      priority: 'medium',
      actionRequired: true,
      metadata: { employee: 'Mike Johnson', dates: 'March 1-3' }
    }
  ]);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderAlerts: true,
    paymentAlerts: true,
    inventoryAlerts: true,
    reviewAlerts: false,
    systemAlerts: true,
    staffAlerts: true
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Bell className="h-4 w-4" />;
      case 'payment': return <CheckCircle className="h-4 w-4" />;
      case 'inventory': return <AlertCircle className="h-4 w-4" />;
      case 'review': return <Info className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'staff': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-500';
      case 'payment': return 'bg-green-500';
      case 'inventory': return 'bg-red-500';
      case 'review': return 'bg-yellow-500';
      case 'system': return 'bg-gray-500';
      case 'staff': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, status: 'read' } : notif
    ));
  };

  const markAsUnread = (id: number) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, status: 'unread' } : notif
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, status: 'read' })));
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'unread').length,
    actionRequired: notifications.filter(n => n.actionRequired).length,
    highPriority: notifications.filter(n => n.priority === 'high').length
  };

  const notificationTypes = ['order', 'payment', 'inventory', 'review', 'system', 'staff'];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with important alerts and messages</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unread</p>
                    <h3 className="text-2xl font-bold mt-2 text-blue-600">{stats.unread}</h3>
                  </div>
                  <BellOff className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Action Required</p>
                    <h3 className="text-2xl font-bold mt-2 text-orange-600">{stats.actionRequired}</h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <h3 className="text-2xl font-bold mt-2 text-red-600">{stats.highPriority}</h3>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {notificationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`transition-all duration-200 hover:shadow-md ${
                    notification.status === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${getTypeColor(notification.type)} text-white`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </span>
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                {notification.actionRequired && (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {notification.status === 'unread' ? (
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => markAsUnread(notification.id)}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Mark as Unread
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Notification Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: (e.target as HTMLInputElement).checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Push</span>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: (e.target as HTMLInputElement).checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Switch 
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: (e.target as HTMLInputElement).checked }))}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Alert Types</h4>
                  {[
                    { key: 'orderAlerts', label: 'Orders', icon: Bell },
                    { key: 'paymentAlerts', label: 'Payments', icon: CheckCircle },
                    { key: 'inventoryAlerts', label: 'Inventory', icon: AlertCircle },
                    { key: 'reviewAlerts', label: 'Reviews', icon: Info },
                    { key: 'systemAlerts', label: 'System', icon: Settings },
                    { key: 'staffAlerts', label: 'Staff', icon: Clock }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{label}</span>
                      </div>
                      <Switch 
                        checked={settings[key]}
                        onChange={(e) => setSettings(prev => ({ ...prev, [key]: (e.target as HTMLInputElement).checked }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}