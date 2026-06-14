# REZ Manufacturing OS

Production & supply chain management service for the Nexha Commerce Network.

## Port: 4343

## Features

- Manufacturing order management
- Bill of Materials (BOM) handling
- Workstation allocation and tracking
- Inventory management with reorder alerts
- Quality control checks
- Production reporting
- Priority-based scheduling

## API Endpoints

### Health
- `GET /health` - Service health status

### Manufacturing Orders
- `POST /api/orders` - Create manufacturing order
- `GET /api/orders` - List orders (filter by status, priority)
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status

### BOMs
- `POST /api/boms` - Create BOM
- `GET /api/boms` - List BOMs (filter by productId)
- `GET /api/boms/:id` - Get BOM by ID

### Workstations
- `POST /api/workstations` - Create workstation
- `GET /api/workstations` - List workstations
- `GET /api/workstations/:id` - Get workstation by ID
- `PATCH /api/workstations/:id/status` - Update workstation status

### Inventory
- `POST /api/inventory` - Add inventory item
- `GET /api/inventory` - List all inventory
- `PATCH /api/inventory/:id` - Update quantity
- `GET /api/inventory/low-stock` - Get low stock items

### Quality
- `POST /api/quality-checks` - Record quality check
- `GET /api/orders/:orderId/quality-checks` - Get quality checks

### Reports
- `POST /api/production-reports` - Create production report
- `GET /api/production-reports` - List reports (filter by date, workstation)

### Stats
- `GET /api/stats` - Get manufacturing statistics

## Running

```bash
npm install
npm run build
npm start
```
