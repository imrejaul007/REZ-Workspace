'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const RestaurantMarketplaceRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified marketplace
    router.replace('/marketplace');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <ShoppingCartIcon className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Marketplace...</h2>
        <p className="text-gray-600">Please wait while we take you to the unified marketplace.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMarketplaceRedirect;