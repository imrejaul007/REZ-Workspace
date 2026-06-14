# RisaCare Records Service

**Health Records and Documents Management**

Central service for storing and managing electronic health records (EHR), medical documents, and clinical data.

## Overview

RisaCare Records Service provides:
- Electronic health records (EHR)
- Document storage and retrieval
- Medical history timeline
- Lab result management
- Imaging reports
- Prescription records

## Features

### Health Records
- Comprehensive medical history
- Problem list management
- Medication history
- Allergy records
- Immunization records

### Document Management
- Upload and store documents
- Document categorization
- Version control
- Access permissions
- Sharing capabilities

### Lab Results
- Import lab results
- Result interpretation
- Trend analysis
- Normal range indicators
- Lab report attachments

### Timeline View
- Chronological health events
- Filterable by category
- Date range selection
- Event details

## Quick Start

```bash
cd risa-care-records-service
npm install
npm run dev
```

Service runs on **port 4702**.

## API Endpoints

### Records
```
POST /api/records                         - Create record
GET  /api/records/:userId                - Get user's records
GET  /api/records/:recordId             - Get specific record
PUT  /api/records/:recordId             - Update record
DELETE /api/records/:recordId           - Delete record
```

### Documents
```
POST /api/records/:userId/documents       - Upload document
GET  /api/records/:userId/documents     - List documents
GET  /api/records/documents/:docId      - Get document
DELETE /api/records/documents/:docId    - Delete document
```

### Lab Results
```
POST /api/records/:userId/lab-results     - Add lab result
GET  /api/records/:userId/lab-results   - Get lab results
GET  /api/records/:userId/lab-results/:id - Get specific result
```

### Timeline
```
GET  /api/records/:userId/timeline     - Get timeline
GET  /api/records/:userId/timeline?category=&from=&to= - Filtered timeline
```

## Usage Examples

### Create Health Record
```bash
curl -X POST http://localhost:4702/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "diagnosis",
    "category": "cardiovascular",
    "title": "Hypertension Diagnosis",
    "description": "Stage 1 hypertension diagnosed",
    "diagnosedDate": "2024-01-15",
    "provider": "Dr. Smith",
    "facility": "City Hospital"
  }'
```

### Upload Document
```bash
curl -X POST http://localhost:4702/api/records/user-123/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Blood Test Report",
    "type": "lab_report",
    "fileUrl": "https://storage.example.com/reports/123.pdf",
    "uploadedBy": "lab-system",
    "metadata": {
      "labName": "City Diagnostics",
      "testDate": "2024-01-20"
    }
  }'
```

### Get Timeline
```bash
curl "http://localhost:4702/api/records/user-123/timeline?category=diagnosis&from=2024-01-01&to=2024-12-31"
```

## Record Types

| Type | Description |
|------|-------------|
| diagnosis | Medical diagnosis |
| procedure | Medical procedures |
| prescription | Medication prescriptions |
| lab_result | Laboratory test results |
| imaging | X-ray, MRI, CT reports |
| vaccination | Immunization records |
| allergy | Allergy records |
| vitals | Vital signs readings |

## Document Types

| Type | Description |
|------|-------------|
| lab_report | Laboratory test reports |
| imaging_report | Radiology reports |
| prescription | Prescription documents |
| discharge_summary | Hospital discharge notes |
| insurance | Insurance documents |
| id_proof | Identity documents |
| medical_certificate | Medical certificates |

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RisaCare Lab Service (4723)
- RisaCare Hospital Service (4721)
- RABTUL Storage for document files

## Port Configuration

| Service | Port |
|---------|------|
| Records Service | 4702 |

## License

Proprietary - RTNM Group
