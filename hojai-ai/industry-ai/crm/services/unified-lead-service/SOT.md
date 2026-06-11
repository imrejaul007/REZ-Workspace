# Unified Lead Service - Statement of Truth

## Service Overview
- **Name**: Unified Lead Service
- **Port**: 3005
- **Type**: CRM Micro-service
- **Version**: 1.0.0

## Core Functionality
Captures and manages leads from all 15 Industry AI products, providing unified lead management, scoring, and assignment capabilities.

## Key Features
1. **Lead Capture**: Adds leads from any of the 15 industries
2. **Lead Scoring**: Calculates lead scores based on profile completeness
3. **Cross-Industry Tracking**: Tracks lead interest across multiple industries
4. **Status Management**: Manages lead lifecycle (new, contacted, qualified, converted, lost)
5. **Assignment**: Assigns leads to sales representatives
6. **Aggregation Analytics**: Provides comprehensive lead statistics

## API Endpoints

### Leads
- `POST /api/leads` - Add new lead
- `GET /api/leads` - Get all leads with filtering
- `GET /api/leads/:id` - Get lead by ID
- `GET /api/leads/email/:email` - Get leads by email
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/leads/top/:limit` - Get top leads by score
- `GET /api/leads/industry/:industry` - Get leads by industry
- `GET /api/leads/unassigned` - Get unassigned leads

### Lead Actions
- `POST /api/leads/:id/assign` - Assign lead to employee
- `POST /api/leads/:id/status` - Update lead status
- `POST /api/leads/rescore` - Rescore all leads

### Analytics
- `GET /api/stats/aggregation` - Get lead aggregation statistics

### Utilities
- `GET /api/industries` - List all industries

## Health Check
- `GET /health` - Service health status

## Dependencies
- express
- cors
- uuid
- winston

## Data Models
- Lead
- LeadFilter
- LeadAggregation

## Status
**READY FOR PRODUCTION**
