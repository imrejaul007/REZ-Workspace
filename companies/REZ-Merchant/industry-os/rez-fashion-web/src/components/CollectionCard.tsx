interface CollectionCardProps {
  id: string;
  name: string;
  season: string;
  year: number;
  products: number;
  status: string;
}

export default function CollectionCard({ id, name, season, year, products, status }: CollectionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">{season} {year}</p>
      <p className="text-sm mt-2">{products} products</p>
      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-3 ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    </div>
  );
}
