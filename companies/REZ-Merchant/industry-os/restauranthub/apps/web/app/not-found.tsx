'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home,
  ArrowLeft,
  Search,
  AlertTriangle,
  ChefHat
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-6 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <AlertTriangle className="h-16 w-16 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 p-2 bg-background rounded-full shadow-lg">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off the menu. 
            It might have been moved, deleted, or you may have typed the wrong URL.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
            
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                <Home className="mr-2 h-5 w-5" />
                Go to Homepage
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Helpful Links</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Link href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </Link>
              <Link href="/marketplace" className="text-primary hover:underline">
                Marketplace
              </Link>
              <Link href="/jobs" className="text-primary hover:underline">
                Jobs
              </Link>
              <Link href="/support" className="text-primary hover:underline">
                Support
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}