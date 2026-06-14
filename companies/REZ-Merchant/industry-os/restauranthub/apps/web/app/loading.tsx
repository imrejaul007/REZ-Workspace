import React from 'react';
import { ChefHat } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="p-4 bg-primary/10 rounded-full animate-pulse">
            <ChefHat className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground animate-pulse">
          Loading RestoPapa...
        </p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}