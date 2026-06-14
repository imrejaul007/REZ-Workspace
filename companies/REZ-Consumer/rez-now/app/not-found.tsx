import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-8xl font-black text-white/30 leading-none select-none">404</p>
      <h1 className="text-2xl font-bold text-white -mt-2">Page not found</h1>
      <p className="text-sm text-indigo-200 max-w-xs leading-relaxed">
        The store you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors px-5 py-2 rounded-full"
      >
        Browse stores
      </Link>
    </div>
  );
}
