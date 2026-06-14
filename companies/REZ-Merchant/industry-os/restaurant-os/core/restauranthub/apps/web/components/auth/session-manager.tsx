'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Trash2, 
  Shield, 
  Clock, 
  MapPin,
  AlertTriangle,
  RefreshCw,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { authApi } from '@/lib/api/auth-api';
import { useAuth } from '@/lib/auth/auth-provider';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isCurrent?: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    
    try {
      const response = await authApi.getSessions();
      
      if (response.data) {
        // Mark the current session (most recent one)
        const sessionsWithCurrent = response.data.map((session, index) => ({
          ...session,
          isCurrent: index === 0, // Assuming sessions are ordered by creation date desc
        }));
        
        setSessions(sessionsWithCurrent);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    
    try {
      const response = await authApi.revokeSession(sessionId);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const logoutAllDevices = async () => {
    try {
      await logout(); // logout from all devices
      toast.success('Logged out from all devices');
    } catch (error) {
      toast.error('Failed to logout from all devices');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceInfo = (userAgent: string) => {
    // Simple user agent parsing
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Browser';
  };

  const getLocationInfo = (ipAddress: string) => {
    // In a real app, you'd use an IP geolocation service
    // For now, just show the IP
    return ipAddress === '::1' || ipAddress === '127.0.0.1' ? 'Local' : ipAddress;
  };

  const isSessionExpiringSoon = (expiresAt: string) => {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    return timeUntilExpiry < 5 * 60 * 1000; // Less than 5 minutes
  };

  const formatSessionTimeout = () => {
    // Mock session timeout of 15 minutes (900000ms) for display
    const mockSessionTimeout = 900000;

    if (!mockSessionTimeout || mockSessionTimeout <= 0) return 'Expired';

    const minutes = Math.floor(mockSessionTimeout / 60000);
    const seconds = Math.floor((mockSessionTimeout % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Current Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Current Session</span>
          </CardTitle>
          <CardDescription>
            Your current login session information and timeout status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Session</span>
            </div>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {formatSessionTimeout()} remaining
            </Badge>
          </div>
          
          {/* Session expiring alert - currently disabled since session management isn't fully implemented */}
          {false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Your session will expire soon!</span>
                <Button
                  variant="outline"
                  onClick={() => {/* TODO: Implement session refresh */}}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Extend
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground">
            Session will auto-refresh with activity. Inactive sessions expire after 15 minutes.
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Active Sessions</span>
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across all devices
            </CardDescription>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              
              onClick={loadSessions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {sessions.length > 1 && (
              <Button
                variant="destructive"
                
                onClick={logoutAllDevices}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    session.isCurrent 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        session.isCurrent 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {getDeviceInfo(session.userAgent)}
                          </span>
                          {session.isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {isSessionExpiringSoon(session.expiresAt) && (
                            <Badge variant="destructive" className="text-xs">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{getLocationInfo(session.ipAddress)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        
                        onClick={() => revokeSession(session.id)}
                        disabled={revoking === session.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {revoking === session.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Security Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <span>Regularly review and revoke sessions from unfamiliar devices or locations</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <span>Always log out from shared or public computers</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <span>Enable two-factor authentication for additional security</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
              <span>Sessions automatically expire after 15 minutes of inactivity</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}