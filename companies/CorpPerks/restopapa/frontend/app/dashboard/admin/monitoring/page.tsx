'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  SignalIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface SystemMetric {
  name: string
  value: string
  status: 'healthy' | 'warning' | 'critical'
  lastUpdate: string
  icon: any
  description: string
}

interface AlertItem {
  id: number
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
  source: string
}

const systemMetrics: SystemMetric[] = [
  {
    name: 'Server Status',
    value: 'Online',
    status: 'healthy',
    lastUpdate: '2 min ago',
    icon: ServerIcon,
    description: 'All servers running normally'
  },
  {
    name: 'Database',
    value: '99.9%',
    status: 'healthy', 
    lastUpdate: '1 min ago',
    icon: CpuChipIcon,
    description: 'Database performance optimal'
  },
  {
    name: 'API Response Time',
    value: '145ms',
    status: 'warning',
    lastUpdate: '30 sec ago',
    icon: SignalIcon,
    description: 'Slightly elevated response times'
  },
  {
    name: 'Storage Usage',
    value: '78%',
    status: 'healthy',
    lastUpdate: '5 min ago',
    icon: CloudIcon,
    description: 'Storage utilization within normal range'
  },
  {
    name: 'Active Users',
    value: '2,847',
    status: 'healthy',
    lastUpdate: '1 min ago',
    icon: ChartBarIcon,
    description: 'Current active user sessions'
  },
  {
    name: 'Error Rate',
    value: '0.02%',
    status: 'healthy',
    lastUpdate: '30 sec ago',
    icon: ExclamationTriangleIcon,
    description: 'System error rate low'
  }
]

const recentAlerts: AlertItem[] = [
  {
    id: 1,
    type: 'warning',
    message: 'High API response time detected on /api/restaurants endpoint',
    timestamp: '2 min ago',
    resolved: false,
    source: 'API Monitor'
  },
  {
    id: 2,
    type: 'info',
    message: 'Daily backup completed successfully',
    timestamp: '1 hour ago',
    resolved: true,
    source: 'Backup Service'
  },
  {
    id: 3,
    type: 'error',
    message: 'Failed payment processing attempt - investigation required',
    timestamp: '3 hours ago',
    resolved: true,
    source: 'Payment Gateway'
  }
]

export default function AdminMonitoring() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>(recentAlerts)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        setLastRefresh(new Date())
      }, 30000) // Refresh every 30 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastRefresh(new Date())
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'critical': return XCircleIcon
      default: return ClockIcon
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return XCircleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'info': return DocumentTextIcon
      default: return BellIcon
    }
  }

  const resolveAlert = (alertId: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-gray-600 mt-1">Real-time platform health and performance monitoring</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRefresh" className="ml-2 text-sm text-gray-700">
                  Auto-refresh every 30s
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {systemMetrics.map((metric, index) => {
            const Icon = metric.icon
            const StatusIcon = getStatusIcon(metric.status)
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-gray-900">{metric.name}</h3>
                  </div>
                  <div className={`p-2 rounded-full ${getStatusColor(metric.status)}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-600 mt-1">{metric.description}</div>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  Updated {metric.lastUpdate}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <span className="text-sm text-gray-500">
              {alerts.filter(a => !a.resolved).length} active alerts
            </span>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type)
              
              return (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)} ${alert.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertIcon className="w-5 h-5 mt-0.5" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        {!alert.resolved && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="text-xs text-gray-600 hover:text-gray-800 ml-4"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-600">
                        <span className="font-medium">{alert.source}</span>
                        <span className="mx-2">•</span>
                        <span>{alert.timestamp}</span>
                        {alert.resolved && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-green-600 font-medium">Resolved</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-12">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
              <p className="text-gray-500">All systems are operating normally</p>
            </div>
          )}
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Server Performance</h3>
              <ServerIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Server performance chart would go here</p>
                <p className="text-sm">Integration with monitoring service needed</p>
              </div>
            </div>
          </div>

          {/* Database Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Database Metrics</h3>
              <CpuChipIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <CpuChipIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Database metrics chart would go here</p>
                <p className="text-sm">Integration with database monitoring needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}