/**
 * REZ Merchant Admin Portals - Testing Guide
 * 
 * Run tests for all admin portals:
 * 
 * 1. Install dependencies in each portal:
 *    cd REZ-restaurant-admin-web && npm install
 * 
 * 2. Run tests:
 *    npm test
 * 
 * 3. Run all portals tests:
 *    for dir in REZ-*-admin-web; do
 *      cd $dir && npm test && cd ..
 *    done
 */

export const TEST_COMMANDS = {
  // Test individual portal
  testPortal: (name: string) => `cd REZ-${name}-admin-web && npm install && npm test`,

  // Test all portals
  testAll: `for dir in REZ-*-admin-web; do cd $dir && npm test && cd ..; done`,

  // Build all portals
  buildAll: `for dir in REZ-*-admin-web; do cd $dir && npm run build && cd ..; done`,

  // Dev all portals (concurrent)
  devAll: `npm run dev --workspaces --if-present`,
};

export const TEST_DATA = {
  // Mock restaurant data for testing
  restaurant: {
    orders: [
      { id: 'ORD001', table: 'T5', items: ['Butter Chicken', 'Naan'], amount: 850, status: 'preparing' },
      { id: 'ORD002', table: 'T12', items: ['Paneer Tikka', 'Rice'], amount: 620, status: 'ready' },
    ],
    menu: [
      { id: 'M001', name: 'Butter Chicken', price: 250, category: 'Main Course' },
      { id: 'M002', name: 'Naan', price: 40, category: 'Bread' },
    ],
  },

  // Mock hotel data for testing
  hotel: {
    bookings: [
      { id: 'BK001', guest: 'John Doe', room: '101', checkIn: '2026-06-15', status: 'confirmed' },
      { id: 'BK002', guest: 'Jane Smith', room: '203', checkIn: '2026-06-16', status: 'checked_in' },
    ],
    rooms: [
      { id: 'R001', number: '101', type: 'Deluxe', status: 'available' },
      { id: 'R002', number: '102', type: 'Standard', status: 'occupied' },
    ],
  },
};

// Test utilities
export const testHelpers = {
  // Wait for element to be visible
  waitForElement: (selector: string, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }
      }, 100);
    });
  },

  // Simulate API response
  mockApiResponse: <T>(data: T, delay = 500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
  },

  // Mock error response
  mockApiError: (error: string, delay = 500): Promise<never> => {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(error)), delay));
  },
};