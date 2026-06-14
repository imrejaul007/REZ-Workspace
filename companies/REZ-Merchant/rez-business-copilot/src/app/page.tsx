'use client';

import { ChatInterface } from '@/components/Chat/ChatInterface';

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">REZ</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500 hidden md:block">
              Business Copilot
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <a
              href="/insights"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Saved Insights
            </a>
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              History
            </button>
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}