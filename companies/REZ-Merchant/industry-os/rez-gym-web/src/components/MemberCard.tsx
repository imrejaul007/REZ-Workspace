'use client';

interface MemberCardProps {
  member: {
    id: string;
    name: string;
    phone: string;
    tier: string;
    status: string;
    totalVisits: number;
  };
  onViewProfile?: () => void;
  onCheckIn?: () => void;
}

export default function MemberCard({ member, onViewProfile, onCheckIn }: MemberCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'frozen': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            💪
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.phone}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(member.status)}`}>
          {member.status.toUpperCase()}
        </span>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tier:</span>
          <span className="font-medium capitalize">{member.tier}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Visits:</span>
          <span className="text-gray-900 font-medium">{member.totalVisits}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onViewProfile}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          View Profile
        </button>
        <button
          onClick={onCheckIn}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Check In
        </button>
      </div>
    </div>
  );
}
