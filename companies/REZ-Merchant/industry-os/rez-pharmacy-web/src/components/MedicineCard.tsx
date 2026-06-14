interface MedicineCardProps {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  quantity: number;
  expiryDate: string;
  onView?: (id: string) => void;
}

export default function MedicineCard({ id, name, genericName, manufacturer, quantity, expiryDate, onView }: MedicineCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">Generic: {genericName}</p>
      <p className="text-sm text-gray-500">Manufacturer: {manufacturer}</p>
      <div className="flex justify-between items-center mt-4">
        <span className={`text-sm ${quantity < 100 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          Stock: {quantity}
        </span>
        <span className="text-sm text-gray-500">Exp: {expiryDate}</span>
      </div>
      <button onClick={() => onView?.(id)} className="w-full mt-4 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
        View Details
      </button>
    </div>
  );
}
