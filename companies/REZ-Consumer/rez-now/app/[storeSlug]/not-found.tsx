import Link from 'next/link';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Store not found</h1>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        This business hasn&apos;t set up their REZ Now page yet, or the link may be incorrect.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        Find another store
      </Link>
    </div>
  );
}
