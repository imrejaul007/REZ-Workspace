'use client';

import { useState } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userType: 'admin' | 'restaurant' | 'employee' | 'system';
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  metadata?: any;
}

export default function AuditLogs() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const auditLogs: AuditLog[] = [
    {
      id: 'AUDIT-2025-001',
      timestamp: '2025-01-15 14:35:22',
      userId: 'admin_001',
      userType: 'admin',
      userName: 'Sarah Johnson',
      action: 'DELETE',
      resource: 'user_account',
      resourceId: 'rest_1234',
      details: 'Permanently deleted restaurant account for policy violation',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'critical',
      status: 'success',
      metadata: { 
        reason: 'policy_violation',
        violationType: 'fake_reviews',
        appealPeriod: '30_days'
      }
    },
    {
      id: 'AUDIT-2025-002',
      timestamp: '2025-01-15 13:22:15',
      userId: 'rest_5678',
      userType: 'restaurant',
      userName: 'Mumbai Spice House',
      action: 'UPDATE',
      resource: 'menu_item',
      resourceId: 'item_9876',
      details: 'Updated pricing for Butter Chicken from ₹350 to ₹380',
      ipAddress: '203.194.5.23',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'low',
      status: 'success',
      metadata: {
        oldPrice: 350,
        newPrice: 380,
        category: 'main_course'
      }
    },
    {
      id: 'AUDIT-2025-003',
      timestamp: '2025-01-15 12:45:33',
      userId: 'system',
      userType: 'system',
      userName: 'Automated Payment System',
      action: 'PROCESS',
      resource: 'payment',
      resourceId: 'pay_abc123',
      details: 'Failed payment processing for order ORD-2025-5432',
      ipAddress: '10.0.0.1',
      userAgent: 'System/1.0',
      severity: 'high',
      status: 'failure',
      metadata: {
        orderId: 'ORD-2025-5432',
        amount: 1250,
        paymentMethod: 'razorpay',
        errorCode: 'CARD_DECLINED'
      }
    },
    {
      id: 'AUDIT-2025-004',
      timestamp: '2025-01-15 11:30:45',
      userId: 'admin_002',
      userType: 'admin',
      userName: 'Rajesh Sharma',
      action: 'APPROVE',
      resource: 'restaurant_verification',
      resourceId: 'verify_789',
      details: 'Approved business verification for Coastal Curry Co',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      severity: 'medium',
      status: 'success',
      metadata: {
        documentsVerified: ['business_license', 'fssai_license', 'pan_card'],
        verificationScore: 98,
        reviewTime: '45_minutes'
      }
    },
    {
      id: 'AUDIT-2025-005',
      timestamp: '2025-01-15 10:15:12',
      userId: 'emp_4567',
      userType: 'employee',
      userName: 'Priya Patel',
      action: 'LOGIN',
      resource: 'user_session',
      resourceId: 'session_xyz789',
      details: 'Successful login attempt',
      ipAddress: '157.32.45.67',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      severity: 'low',
      status: 'success',
      metadata: {
        loginMethod: 'password',
        deviceType: 'mobile',
        location: 'Delhi, India'
      }
    },
    {
      id: 'AUDIT-2025-006',
      timestamp: '2025-01-15 09:42:18',
      userId: 'rest_9876',
      userType: 'restaurant',
      userName: 'Delhi Darbar',
      action: 'CREATE',
      resource: 'job_posting',
      resourceId: 'job_4321',
      details: 'Created new job posting for Head Chef position',
      ipAddress: '203.194.8.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'low',
      status: 'success',
      metadata: {
        jobTitle: 'Head Chef',
        salary: '₹45,000/month',
        location: 'Delhi',
        jobType: 'full_time'
      }
    },
    {
      id: 'AUDIT-2025-007',
      timestamp: '2025-01-15 08:20:30',
      userId: 'system',
      userType: 'system',
      userName: 'Data Backup Service',
      action: 'BACKUP',
      resource: 'database',
      resourceId: 'backup_daily_150125',
      details: 'Daily database backup completed successfully',
      ipAddress: '10.0.0.2',
      userAgent: 'BackupService/2.1',
      severity: 'low',
      status: 'success',
      metadata: {
        backupSize: '2.4GB',
        duration: '23_minutes',
        tablesBackedUp: 47,
        compressionRatio: 0.65
      }
    },
    {
      id: 'AUDIT-2025-008',
      timestamp: '2025-01-15 07:55:44',
      userId: 'admin_003',
      userType: 'admin',
      userName: 'Anita Desai',
      action: 'BLOCK',
      resource: 'user_account',
      resourceId: 'emp_8901',
      details: 'Blocked employee account for suspicious activity',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'high',
      status: 'success',
      metadata: {
        reason: 'suspicious_login_patterns',
        blockDuration: 'temporary_24h',
        investigationId: 'INV-2025-123'
      }
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'restaurant': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-indigo-100 text-indigo-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'approve': return '✅';
      case 'reject': return '❌';
      case 'block': return '🚫';
      case 'backup': return '💾';
      case 'process': return '⚙️';
      default: return '📝';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = selectedFilter === 'all' || log.userType === selectedFilter;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSeverity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">Track all system activities and user actions for security and compliance</p>
        </div>

        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="restaurant">Restaurants Only</option>
              <option value="employee">Employees Only</option>
              <option value="system">System Only</option>
            </select>
            
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600 text-xl">🚨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-lg font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Failed Actions</p>
                <p className="text-lg font-semibold text-gray-900">45</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg font-semibold text-gray-900">1,247</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-lg font-semibold text-gray-900">8,921</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
            <p className="text-sm text-gray-500">Showing {filteredLogs.length} of {auditLogs.length} logs</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(log.timestamp).toLocaleDateString('en-IN')}</div>
                      <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeColor(log.userType)}`}>
                            {log.userType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{getActionIcon(log.action)}</span>
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.resource}</div>
                        <div className="text-xs text-gray-500">{log.resourceId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing 1-{filteredLogs.length} of {auditLogs.length} logs
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Previous</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Log ID</label>
                    <p className="text-sm text-gray-900">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-sm text-gray-900">{selectedLog.timestamp}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <p className="text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userType})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Action</label>
                    <p className="text-sm text-gray-900">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resource</label>
                    <p className="text-sm text-gray-900">{selectedLog.resource} ({selectedLog.resourceId})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Details</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.details}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-sm text-gray-900 mt-1 break-all">{selectedLog.userAgent}</p>
                </div>
                
                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="text-xs text-gray-900 mt-1 bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                      Status: {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedLog.severity)}`}>
                      Severity: {selectedLog.severity}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}