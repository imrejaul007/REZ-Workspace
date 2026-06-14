'use client';

import React from 'react';

interface Room {
  number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
}

interface RoomGridProps {
  rooms: Room[];
  onRoomClick?: (roomNumber: string) => void;
}

const statusStyles = {
  available: 'bg-green-100 text-green-800 hover:bg-green-200',
  occupied: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  maintenance: 'bg-red-100 text-red-800 hover:bg-red-200',
  cleaning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
};

export default function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
        {rooms.map(room => (
          <button
            key={room.number}
            className={`p-3 rounded-lg text-center font-medium transition-colors ${statusStyles[room.status]}`}
            onClick={() => onRoomClick?.(room.number)}
          >
            {room.number}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-100 rounded"></span> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-100 rounded"></span> Occupied
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-yellow-100 rounded"></span> Cleaning
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-100 rounded"></span> Maintenance
        </span>
      </div>
    </div>
  );
}
