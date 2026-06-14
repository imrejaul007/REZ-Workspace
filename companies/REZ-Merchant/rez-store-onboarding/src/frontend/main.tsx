import React from 'react';
import ReactDOM from 'react-dom/client';
import OnboardingFlow from './pages/OnboardingFlow';

// Demo App Component
const App: React.FC = () => {
  const [completedStore, setCompletedStore] = React.useState<string | null>(null);

  const handleComplete = (store: { id: string; name: string }) => {
    console.log('Onboarding completed!', store);
    setCompletedStore(JSON.stringify(store, null, 2));
  };

  const handleError = (error: string) => {
    console.error('Onboarding error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">ReZ Store Onboarding</h1>
        </div>
      </header>

      <main className="py-8">
        {completedStore ? (
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Onboarding Complete!</h2>
              <p className="text-green-700 mb-4">Your store is now ready to use.</p>
              <pre className="text-left bg-white p-4 rounded border border-green-200 text-sm overflow-auto">
                {completedStore}
              </pre>
              <button
                onClick={() => setCompletedStore(null)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Start New Onboarding
              </button>
            </div>
          </div>
        ) : (
          <OnboardingFlow
            merchantId="demo-merchant-001"
            onComplete={handleComplete}
            onError={handleError}
          />
        )}
      </main>
    </div>
  );
};

// Mount the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
