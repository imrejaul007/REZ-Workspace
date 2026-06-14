import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Custom matchers and utilities
export const testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  },

  // Mock restaurant data
  mockRestaurant: {
    id: 'test-restaurant-id',
    name: 'Test Restaurant',
    description: 'A wonderful test restaurant',
    address: '123 Test Street, Test City',
    phone: '+1234567890',
    email: 'restaurant@test.com',
    cuisineType: ['Italian', 'Indian'],
    rating: 4.5,
    totalReviews: 100,
    isOpen: true,
    deliveryTime: '30-45 min',
    minimumOrder: 200,
    deliveryFee: 40,
    imageUrl: 'https://example.com/restaurant.jpg',
  },

  // Helper to create mock API responses
  createMockApiResponse: <T>(data: T, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error',
    timestamp: new Date().toISOString(),
  }),

  // Mock fetch responses
  mockFetch: (response, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 400,
      json: async () => response,
      text: async () => JSON.stringify(response),
    })
  },

  // Cleanup helper
  cleanup: () => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  },
}

export { waitFor, screen, fireEvent } from '@testing-library/react'
export default testUtils
