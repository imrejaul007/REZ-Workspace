/**
 * Security AI - Society Security & Access Control
 * Part of NEIGHBORAI - Society Management AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  flatNumber: string;
  purpose: 'delivery' | 'guest' | 'service' | 'vendor' | 'emergency';
  expectedBy: string;
  hostName: string;
  hostPhone: string;
  status: 'pending' | 'checked-in' | 'checked-out' | 'denied';
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AccessRequest {
  id: string;
  residentId: string;
  type: 'guest' | 'delivery' | 'service';
  visitorName: string;
  visitorPhone: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface SecurityAlert {
  id: string;
  type: 'intrusion' | 'fire' | 'medical' | 'suspicious' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export class SecurityAI {
  private visitors: Map<string, Visitor> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();

  async registerVisitor(data: Omit<Visitor, 'id' | 'status' | 'checkInTime' | 'checkOutTime'>): Promise<Visitor> {
    const visitor: Visitor = {
      ...data,
      id: uuidv4(),
      status: 'pending'
    };

    this.visitors.set(visitor.id, visitor);
    return visitor;
  }

  async approveVisitorAccess(visitorId: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(visitorId);
    if (!visitor) return undefined;

    visitor.status = 'pending';
    return visitor;
  }

  async checkInVisitor(visitorId: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(visitorId);
    if (!visitor) return undefined;

    visitor.status = 'checked-in';
    visitor.checkInTime = new Date().toISOString();
    this.visitors.set(visitorId, visitor);
    return visitor;
  }

  async checkOutVisitor(visitorId: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(visitorId);
    if (!visitor) return undefined;

    visitor.status = 'checked-out';
    visitor.checkOutTime = new Date().toISOString();
    this.visitors.set(visitorId, visitor);
    return visitor;
  }

  async createAccessRequest(data: Omit<AccessRequest, 'id' | 'status'>): Promise<AccessRequest> {
    const request: AccessRequest = {
      ...data,
      id: uuidv4(),
      status: 'pending'
    };

    return request;
  }

  async createAlert(data: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      ...data,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  async getActiveAlerts(): Promise<SecurityAlert[]> {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  async resolveAlert(alertId: string, resolution: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    this.alerts.set(alertId, alert);
    return true;
  }

  async getVisitorLog(date: string): Promise<Visitor[]> {
    return Array.from(this.visitors.values())
      .filter(v => v.checkInTime?.startsWith(date));
  }

  async generateSecurityReport(period: 'day' | 'week' | 'month'): Promise<{
    totalVisitors: number;
    byPurpose: Record<string, number>;
    averageStayDuration: number;
    unresolvedAlerts: number;
    recommendations: string[];
  }> {
    return {
      totalVisitors: Math.floor(Math.random() * 100) + 20,
      byPurpose: { delivery: 45, guest: 30, service: 20, vendor: 5 },
      averageStayDuration: 45,
      unresolvedAlerts: Math.floor(Math.random() * 5),
      recommendations: [
        'Consider adding more CCTV cameras at entrance',
        'Review visitor check-in procedures'
      ]
    };
  }
}

export default SecurityAI;