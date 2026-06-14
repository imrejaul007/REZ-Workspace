'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Building2,
  Users,
  Package,
  Star,
  Activity,
  Settings,
  Download,
  Eye,
  MessageSquare,
  Flag,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'restaurant' | 'employee' | 'vendor' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  verified: boolean;
  joinedAt: string;
  lastLogin: string;
  location: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    reviews: number;
    rating: number;
  };
  profile: Record<string, unknown>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else if (res.status === 404) {
          setError('not_found');
        } else {
          setError('failed');
          toast.error('Failed to load user data');
        }
      } catch {
        setError('failed');
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) loadUserData();
  }, [userId]);

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'banned') => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, status: newStatus } : null);
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update user status');
      }
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant': return Building2;
      case 'employee': return Users;
      case 'vendor': return Package;
      default: return Star;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded animate-pulse" />
              <div className="h-96 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted rounded animate-pulse" />
              <div className="h-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'not_found' || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">User Not Found</h3>
          <p className="text-muted-foreground mb-4">The user you are looking for does not exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusChange('suspended')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Suspend User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('banned')} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </DropdownMenuItem>
              {(user.status === 'suspended' || user.status === 'banned') && (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reactivate User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl font-semibold">{user.name}</h2>
                    {user.verified && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                    <RoleIcon className="h-4 w-4" />
                    <span className="capitalize">{user.role}</span>
                    <span>•</span>
                    <span>ID: {user.id}</span>
                  </div>
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                  {user.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Order history not yet available via API.</p>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <CardHeader>
                  <CardTitle>Reviews and Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Reviews not yet available via API.</p>
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Account settings not yet available via API.</p>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{user.stats?.totalOrders ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user.stats?.totalSpent != null ? `$${user.stats.totalSpent.toLocaleString()}` : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.stats?.reviews ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{user.stats?.rating ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive"
                onClick={() => handleStatusChange(user.status === 'active' ? 'suspended' : 'active')}
              >
                <Ban className="h-4 w-4 mr-2" />
                {user.status === 'active' ? 'Suspend User' : 'Reactivate User'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
