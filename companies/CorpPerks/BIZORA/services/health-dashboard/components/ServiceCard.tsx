import { LucideIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface ServiceCardProps {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  lastChecked: string;
  icon: LucideIcon;
  description: string;
}

export default function ServiceCard({
  name,
  status,
  uptime,
  responseTime,
  lastChecked,
  icon: Icon,
  description,
}: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            status === 'healthy' ? 'bg-status-green-bg' :
            status === 'warning' ? 'bg-status-yellow-bg' :
            'bg-status-red-bg'
          }`}>
            <Icon className={`w-5 h-5 ${
              status === 'healthy' ? 'text-status-green' :
              status === 'warning' ? 'text-status-yellow' :
              'text-status-red'
            }`} />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Uptime</p>
          <p className={`text-lg font-semibold ${
            uptime >= 99.9 ? 'text-status-green' :
            uptime >= 99 ? 'text-status-yellow' :
            'text-status-red'
          }`}>
            {uptime.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Response</p>
          <p className={`text-lg font-semibold ${
            responseTime < 50 ? 'text-status-green' :
            responseTime < 100 ? 'text-status-yellow' :
            'text-status-red'
          }`}>
            {responseTime}ms
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Last checked: {lastChecked}
        </p>
      </div>
    </div>
  );
}
