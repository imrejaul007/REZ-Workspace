# REZ Document Processor

Document processing service - PDF/DOCX parsing and analysis.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload document |
| GET | `/api/documents` | Search documents |
| GET | `/api/documents/stats` | Get statistics |
| GET | `/api/documents/:id` | Get document by ID |
| POST | `/api/documents/:id/process` | Process document |
| GET | `/api/documents/:id/sections` | Get sections |
| GET | `/api/documents/:id/entities` | Get extracted entities |
| GET | `/api/jobs/:jobId` | Get job status |

## Features

- Document upload and storage
- Text extraction from PDF, DOCX, TXT
- Table extraction
- Named entity recognition (NER)
- Document summarization
- Section parsing
- Full-text search

## License

MIT
