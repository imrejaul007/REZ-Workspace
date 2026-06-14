#!/bin/bash

echo "🔧 Quick API Fixes for Development"
echo "================================="

cd apps/api

# Install missing dependencies
echo "Installing missing dependencies..."
npm install @nestjs/terminus express-rate-limit compression csurf --save

# Create missing service files
echo "Creating missing service files..."

# Create verification service stub
cat > src/modules/admin/verification.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  // Placeholder methods - implement as needed
  async verifyRestaurant(restaurantId: string) {
    return { success: true, message: 'Restaurant verification pending' };
  }

  async verifyVendor(vendorId: string) {
    return { success: true, message: 'Vendor verification pending' };
  }
}
EOF

# Create analytics service stub
cat > src/modules/admin/analytics.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Placeholder methods - implement as needed
  async getBusinessMetrics() {
    return { 
      totalUsers: 0, 
      totalOrders: 0, 
      totalRevenue: 0 
    };
  }
}
EOF

# Create missing types file
cat > src/client/types.ts << 'EOF'
// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search Types
export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

// Order Update Types
export interface OrderUpdate {
  orderId: string;
  status: string;
  message?: string;
  timestamp: string;
}

// Notification Types
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// User Types from Prisma
export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}
EOF

echo "✅ Quick fixes applied!"
echo ""
echo "Note: These are minimal fixes to get the development server running."
echo "Full implementation of services and types is still needed."