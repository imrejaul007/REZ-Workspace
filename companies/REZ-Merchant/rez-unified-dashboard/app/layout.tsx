/**
 * REZ Unified Merchant Dashboard
 *
 * Single dashboard aggregating all merchant data:
 * - Orders
 * - Customers
 * - Inventory
 * - Financials
 * - Loyalty
 * - Marketing
 * - B2B
 * - Trust Score
 */

import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>REZ Merchant Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
