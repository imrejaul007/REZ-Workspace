interface TimeSlot {
  time: string;
  isAvailable: boolean;
  bookingId?: string;
}

interface BookingCalendarProps {
  selectedDate: string;
  timeSlots: TimeSlot[];
  onSlotClick?: (time: string, isAvailable: boolean) => void;
}

export default function BookingCalendar({
  selectedDate,
  timeSlots,
  onSlotClick
}: BookingCalendarProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    if (!slot.isAvailable) {
      return 'bg-red-50 border-l-4 border-red-500 cursor-not-allowed';
    }
    return 'bg-green-50 border-l-4 border-green-500 cursor-pointer hover:bg-green-100';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {timeSlots.map(slot => (
          <div
            key={slot.time}
            className={`flex min-h-[60px] ${getSlotStyle(slot)}`}
            onClick={() => onSlotClick?.(slot.time, slot.isAvailable)}
          >
            <div className="w-24 p-4 border-r border-gray-200 text-gray-500 font-medium flex items-center">
              {slot.time}
            </div>
            <div className="flex-1 p-4">
              {slot.isAvailable ? (
                <span className="text-green-700">Available - Click to book</span>
              ) : (
                <span className="text-red-700">Booked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
