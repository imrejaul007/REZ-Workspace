/**
 * TreasuryOS Dashboard - Alerts Page
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react';

interface Alert {
  id: string;
  type: 'shortfall' | 'maturity' | 'threshold' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  date: string;
  status: 'active' | 'acknowledged' | 'resolved';
  actions?: { label: string; action: string }[];
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert_1',
      type: 'maturity',
      severity: 'high',
      title: 'FD Maturizing Soon',
      message: 'HDFC FD Q2 of ₹1,00,000 is maturing in 7 days. Current value: ₹1,07,500.',
      date: 'Jun 13, 2024',
      status: 'active',
      actions: [
        { label: 'Renew FD', action: 'renew' },
        { label: 'Redeem', action: 'redeem' },
      ],
    },
    {
      id: 'alert_2',
      type: 'threshold',
      severity: 'medium',
      title: 'Low Cash Balance',
      message: 'Operating account balance has fallen below ₹50,000 threshold.',
      date: 'Jun 12, 2024',
      status: 'acknowledged',
    },
    {
      id: 'alert_3',
      type: 'system',
      severity: 'low',
      title: 'Forecast Updated',
      message: '13-week cash flow forecast has been automatically refreshed.',
      date: 'Jun 10, 2024',
      status: 'resolved',
    },
  ]);

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'acknowledged' } : a
    ));
  };

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'resolved' } : a
    ));
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityStyle = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
          <p className="text-gray-500">Manage treasury alerts and actions</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
            <span className="font-bold">{activeAlerts.length}</span> Active
          </div>
          <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
            <span className="font-bold">{acknowledgedAlerts.length}</span> Acknowledged
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Active Alerts
        </h2>
        {activeAlerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            No active alerts. Your treasury is in good health!
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div key={alert.id} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${getSeverityStyle(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <h3 className="font-semibold text-lg">{alert.title}</h3>
                    <p className="text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {alert.date}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex gap-3">
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Acknowledge
                </button>
                {alert.actions?.map((action) => (
                  <button
                    key={action.action}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Acknowledged
          </h2>
          {acknowledgedAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold">{alert.title}</h3>
                    <p className="text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-400 mt-2">{alert.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-500">
            <CheckCircle className="w-5 h-5" />
            Resolved (Last 7 days)
          </h2>
          {resolvedAlerts.map((alert) => (
            <div key={alert.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium text-gray-700">{alert.title}</h3>
                  <p className="text-sm text-gray-400">{alert.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;