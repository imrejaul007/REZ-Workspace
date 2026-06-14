'use client';

import { StoreInfo } from '@/lib/types';

interface RetailCatalogProps {
  store: StoreInfo;
}

export default function RetailCatalog({ store }: RetailCatalogProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h1>
      <div className="bg-indigo-50 rounded-xl p-4 text-center">
        <p className="text-indigo-700 font-medium">Retail Catalog</p>
        <p className="text-sm text-indigo-500 mt-1">Catalog items loading...</p>
      </div>
    </div>
  );
}
