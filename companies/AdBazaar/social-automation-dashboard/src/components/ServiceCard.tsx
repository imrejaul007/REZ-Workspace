'use client';

import { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Play,
  Square,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { Service } from '@/types';
import axios from 'axios';

interface ServiceCardProps {
  service: Service;
  onStatusChange: (id: string, status: 'online' | 'offline', responseTime?: number) => void;
}

export default function ServiceCard({ service, onStatusChange }: ServiceCardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    try {
      const response = await axios.get(`http://localhost:${service.port}/health`, {
        timeout: 5000,
      });
      const responseTime = Date.now() - startTime;
      if (response.status === 200) {
        onStatusChange(service.id, 'online', responseTime);
      } else {
        onStatusChange(service.id, 'offline');
      }
    } catch {
      onStatusChange(service.id, 'offline');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    switch (service.status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const formatLastChecked = () => {
    if (!service.lastChecked) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - service.lastChecked.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {service.name}
            </h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {service.description}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} flex-shrink-0 ${
            service.status === 'online' ? 'animate-pulse-dot' : ''
          }`} />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 space-y-2 bg-slate-800/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Port</span>
          <span className="font-mono text-blue-400">{service.port}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Status</span>
          <span className={`font-medium ${
            service.status === 'online' ? 'text-green-400' :
            service.status === 'offline' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Last Checked</span>
          <span className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatLastChecked()}
          </span>
        </div>
        {service.responseTime && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Response Time</span>
            <span className="text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              {service.responseTime}ms
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-slate-900/50 flex items-center gap-2">
        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Health Check
        </button>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="px-4 py-3 bg-black/50 border-t border-slate-700">
          <div className="text-xs text-slate-500 font-mono">
            {service.status === 'online' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{service.name} is running</span>
                </div>
                <div>Port: {service.port}</div>
                <div>Last response: {service.responseTime}ms</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-3 h-3" />
                  <span>Connection failed</span>
                </div>
                <div>Could not connect to port {service.port}</div>
                <div>Error: Service unavailable</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
