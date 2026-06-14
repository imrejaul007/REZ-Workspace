interface ServiceCardProps {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  isPopular?: boolean;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

export default function ServiceCard({
  id,
  name,
  category,
  duration,
  price,
  isPopular,
  onEdit,
  onView
}: ServiceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500 capitalize">{category}</p>
        </div>
        {isPopular && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Popular
          </span>
        )}
      </div>

      <div className="flex items-center text-gray-600 mb-4">
        <span className="mr-4">⏱ {duration} min</span>
        <span className="font-semibold text-purple-600">₹{price.toLocaleString()}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit?.(id)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onView?.(id)}
          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          View
        </button>
      </div>
    </div>
  );
}
