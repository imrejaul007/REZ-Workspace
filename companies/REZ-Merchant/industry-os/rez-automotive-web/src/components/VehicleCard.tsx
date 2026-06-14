interface VehicleCardProps {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function VehicleCard({ id, registrationNumber, make, model, year, onView, onEdit }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{registrationNumber}</h3>
      <p className="text-sm text-gray-500">{make} {model} ({year})</p>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onView?.(id)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">View</button>
        <button onClick={() => onEdit?.(id)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
      </div>
    </div>
  );
}
