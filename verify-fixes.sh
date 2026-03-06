#!/bin/bash

# ChronosAI - CI/CD Fix Verification Script
# Run this before pushing to verify all fixes work locally

set -e  # Exit on any error

echo "🚀 ChronosAI CI/CD Fix Verification"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
cd backend

echo "📦 Step 1: Installing dependencies..."
python -m pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo "🔍 Step 2: Running Ruff linter..."
if ruff check app tests; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi
echo ""

echo "🔍 Step 3: Running Mypy type checker..."
if mypy app; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi
echo ""

echo "🧪 Step 4: Running tests with coverage..."
if PYTHONPATH=. pytest -v --cov=app --cov-report=term-missing --cov-fail-under=50; then
    echo -e "${GREEN}✅ All tests passed with sufficient coverage${NC}"
else
    echo -e "${RED}❌ Tests failed or coverage too low${NC}"
    exit 1
fi
echo ""

echo "🎉 SUCCESS! All checks passed!"
echo ""
echo "Next steps:"
echo "1. Review the changes:"
echo "   git status"
echo "   git diff"
echo ""
echo "2. Commit the fixes:"
echo "   git add ."
echo "   git commit -m 'fix: CI/CD pipeline - update test schemas and coverage threshold'"
echo ""
echo "3. Push to trigger CI/CD:"
echo "   git push origin main"
echo ""
echo "4. Monitor the pipeline:"
echo "   https://github.com/johan-droid/ChronusAI/actions"
echo ""
echo -e "${GREEN}✅ Ready for deployment!${NC}"
