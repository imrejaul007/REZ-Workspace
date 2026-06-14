# Workforce OS

## Overview
AI workforce management across all industries for RTMN.

## Port: 3021

## Features
- **Agent Management**: Manage 200+ AI agents across industries
- **Team Organization**: Create and manage teams
- **Skills Library**: Skills tracking and matching
- **Performance Metrics**: Agent and team performance tracking

## Agent States
- available, busy, offline, training, maintenance

## Agent Roles
- coordinator, specialist, analyst, executor, monitor

## Routes
- `agents.js` - Agent CRUD and management
- `teams.js` - Team management
- `skills.js` - Skills library
- `performance.js` - Performance metrics

## API Endpoints
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/skills` - List skills
- `GET /api/performance` - Performance overview

## Industry Coverage
All 24 RTMN industries supported.

## Dependencies
- express, cors, helmet, redis, uuid, winston
