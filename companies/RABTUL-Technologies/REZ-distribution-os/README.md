# REZ Distribution OS

Distributor & wholesaler management service for the Nexha Commerce Network.

## Port: 4340

## Features

- Distributor registration and management
- Order processing (purchase, return, transfer)
- Inventory tracking with reservations
- Retailer network management
- Credit limit and balance tracking
- Multi-territory support

## API Endpoints

### Health
- `GET /health` - Service health status

### Distributors
- `POST /api/distributors` - Create distributor
- `GET /api/distributors` - List all distributors
- `GET /api/distributors/:id` - Get distributor by ID
- `PUT /api/distributors/:id` - Update distributor
- `DELETE /api/distributors/:id` - Delete distributor

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders (filter by distributorId)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status

### Inventory
- `POST /api/inventory` - Add inventory item
- `GET /api/inventory` - List inventory (filter by distributorId)
- `PATCH /api/inventory/:id` - Update quantity
- `POST /api/inventory/:id/reserve` - Reserve inventory

### Retailers
- `POST /api/retailers` - Create retailer
- `GET /api/retailers` - List retailers (filter by distributorId)
- `GET /api/retailers/:id` - Get retailer by ID

### Stats
- `GET /api/stats` - Get distribution statistics

## Models

### Distributor
```typescript
{
  id: string;
  name: string;
  code: string;
  type: 'wholesaler' | 'distributor' | 'sub-distributor';
  email: string;
  phone: string;
  address: Address;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'suspended' | 'inactive';
  territories: string[];
}
```

### Order
```typescript
{
  id: string;
  orderNumber: string;
  distributorId: string;
  type: 'purchase' | 'return' | 'transfer';
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
}
```

## Running

```bash
npm install
npm run build
npm start
```
