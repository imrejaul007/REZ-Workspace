# Churn Prediction Service

ML-based churn risk identification for AdBazaar.

## Overview

This service provides machine learning-based churn prediction to identify at-risk customers before they churn, enabling proactive retention interventions.

## Features

- **ML-Based Risk Scoring**: Algorithm-driven churn risk assessment
- **Time-Based Predictions**: 30/60/90 day churn probability
- **Risk Factor Analysis**: Identifies key churn drivers
- **Alert System**: Automated alerts for risk changes
- **Intervention Recommendations**: Actionable retention steps

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/churn/:customerId` | Get churn risk |
| POST | `/api/churn/:customerId/score` | Calculate churn risk |
| GET | `/api/churn` | Get dashboard data |
| GET | `/api/churn/alerts` | Get alerts |
| POST | `/api/churn/alerts/:alertId/acknowledge` | Acknowledge alert |
| POST | `/api/churn/alerts/:alertId/resolve` | Resolve alert |
| GET | `/api/churn/analytics` | Get analytics |
| GET | `/api/churn/high-risk` | Get high risk customers |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

## Port

**Port: 5079**