'use client';

export function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
    >
      Try again
    </button>
  );
}
