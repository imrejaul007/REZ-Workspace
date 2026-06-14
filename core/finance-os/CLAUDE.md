# Finance OS

## Overview
Financial operations across all industries for RTMN.

## Port: 3023

## Features
- **Ledger Management**: Multi-account ledger with double-entry
- **Budget Tracking**: Budget creation and allocation
- **Expense Management**: Expense tracking and categorization
- **Financial Reports**: Income statement, balance sheet, cash flow

## Account Types
- asset, liability, equity, revenue, expense

## Transaction Types
- credit, debit, transfer, adjustment

## Budget Status
- draft, active, exceeded, closed

## Routes
- `ledger.js` - Ledger and accounts
- `budgets.js` - Budget management
- `expenses.js` - Expense tracking
- `reports.js` - Financial reports

## API Endpoints
- `GET /api/ledger` - Ledger overview
- `POST /api/ledger/account` - Create account
- `POST /api/ledger/entry` - Create entry
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/expenses` - List expenses
- `GET /api/reports` - Generate reports

## Industry Coverage
All 24 RTMN industries supported.

## Dependencies
- express, cors, helmet, redis, uuid, winston
