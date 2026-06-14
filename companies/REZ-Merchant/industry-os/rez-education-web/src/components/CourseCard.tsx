interface CourseCardProps {
  id: string;
  name: string;
  category: string;
  duration: string;
  fee: number;
  students: number;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

export default function CourseCard({
  id,
  name,
  category,
  duration,
  fee,
  students,
  onEdit,
  onView
}: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-gray-600">Duration: {duration}</p>
        <p className="text-gray-600">Fee: ₹{fee.toLocaleString()}</p>
        <p className="text-gray-600">Students: {students}</p>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit?.(id)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onView?.(id)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View
        </button>
      </div>
    </div>
  );
}
