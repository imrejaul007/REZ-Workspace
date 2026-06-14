interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        status === 'healthy'
          ? 'bg-status-green-bg text-status-green'
          : status === 'warning'
          ? 'bg-status-yellow-bg text-status-yellow'
          : 'bg-status-red-bg text-status-red'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'healthy'
            ? 'bg-status-green'
            : status === 'warning'
            ? 'bg-status-yellow'
            : 'bg-status-red'
        }`}
      />
      {status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Warning' : 'Critical'}
    </span>
  );
}
