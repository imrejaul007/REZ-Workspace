'use client';

import React from 'react';
import type { ServiceRequest } from '@/types';

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onStatusChange: (id: string, status: ServiceRequest['status']) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ServiceRequestCard({ request, onStatusChange }: ServiceRequestCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-lg text-blue-800">
          {request.roomNumber}
        </div>
        <div>
          <div className="font-bold">{request.type}</div>
          <div className="text-gray-500 text-sm">{request.time}</div>
          {request.notes && (
            <div className="text-gray-400 text-xs mt-1">{request.notes}</div>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[request.status]}`}>
          {statusLabels[request.status]}
        </span>
        {request.status === 'pending' && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            onClick={() => onStatusChange(request.id, 'in_progress')}
          >
            Start
          </button>
        )}
        {request.status === 'in_progress' && (
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
            onClick={() => onStatusChange(request.id, 'completed')}
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
}
