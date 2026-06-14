#!/bin/bash
set -e

echo "=========================================="
echo "Running tests for new features..."
echo "=========================================="

cd "/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service"

# Run new feature tests
echo ""
echo "Running jest tests..."
npm test -- --testPathPattern="new-features" --coverage --passWithNoTests

echo ""
echo "=========================================="
echo "Tests complete!"
echo "=========================================="
