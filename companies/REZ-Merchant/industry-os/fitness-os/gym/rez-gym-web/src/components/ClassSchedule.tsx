'use client';

import { useState } from 'react';

interface ClassItem {
  id: string;
  name: string;
  type: string;
  trainer: string;
  time: string;
  enrolled: number;
  capacity: number;
}

interface ClassScheduleProps {
  classes: ClassItem[];
  selectedDay: number;
  onDayChange: (day: number) => void;
  onBookClass: (classId: string) => void;
}

export default function ClassSchedule({ classes, selectedDay, onDayChange, onBookClass }: ClassScheduleProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Day Selector */}
      <div className="flex border-b overflow-x-auto">
        {days.map((day, index) => (
          <button
            key={day}
            onClick={() => onDayChange(index)}
            className={`flex-1 min-w-[60px] px-4 py-3 text-sm font-medium transition ${
              selectedDay === index
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Class List */}
      <div className="p-4 space-y-4">
        {classes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No classes scheduled for this day</p>
        ) : (
          classes.map((gymClass) => (
            <div key={gymClass.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{gymClass.name}</h3>
                  <p className="text-sm text-gray-500">{gymClass.trainer}</p>
                </div>
                <span className="text-sm font-medium text-gray-900">{gymClass.time}</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full ${
                        gymClass.enrolled >= gymClass.capacity ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(gymClass.enrolled / gymClass.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {gymClass.enrolled}/{gymClass.capacity}
                  </span>
                </div>

                <button
                  onClick={() => onBookClass(gymClass.id)}
                  disabled={gymClass.enrolled >= gymClass.capacity}
                  className={`px-4 py-2 text-sm rounded-lg transition ${
                    gymClass.enrolled >= gymClass.capacity
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {gymClass.enrolled >= gymClass.capacity ? 'Full' : 'Book'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
