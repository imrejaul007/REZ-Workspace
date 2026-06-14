# REZ Workflow Templates Service

Pre-built industry workflow templates for rapid deployment on the REZ AI platform.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List all templates |
| GET | `/api/workflows/:id` | Get template by ID |
| GET | `/api/workflows/categories` | List categories |
| GET | `/api/workflows/industries` | List industries |
| GET | `/api/workflows/featured` | Featured templates |
| GET | `/api/workflows/search?q=` | Search templates |
| POST | `/api/workflows/:id/instantiate` | Create workflow from template |

## Industries

- 🍽️ Restaurant & Food Service
- 🏥 Healthcare & Medical
- 💰 Finance & Banking
- 🛒 Retail & E-commerce
- 👥 Human Resources

## License

MIT
