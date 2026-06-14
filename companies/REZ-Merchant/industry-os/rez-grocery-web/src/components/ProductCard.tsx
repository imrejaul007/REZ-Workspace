interface ProductCardProps {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
}

export default function ProductCard({ id, name, sku, category, quantity, price }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">SKU: {sku}</p>
      <p className="text-sm text-gray-500">Category: {category}</p>
      <div className="flex justify-between items-center mt-4">
        <span className={`text-sm ${quantity < 25 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          Stock: {quantity}
        </span>
        <span className="font-semibold text-green-600">₹{price}</span>
      </div>
    </div>
  );
}
