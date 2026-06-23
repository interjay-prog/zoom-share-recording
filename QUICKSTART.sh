#!/bin/bash

# Zoom Recording Auto-Share - Quick Start Script

set -e

echo "🚀 Zoom Recording Auto-Share - Quick Start"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js found: $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm found: $(npm -v)"

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You'll need PostgreSQL running separately"
else
    echo "✅ Docker found"
fi

echo ""
echo -e "${BLUE}Setting up project...${NC}"

# Setup backend
echo ""
echo "📦 Backend Setup"
cd backend
cp -n .env.example .env
echo "✅ Backend .env created (update with your Zoom credentials)"
npm install
cd ..

# Setup frontend
echo ""
echo "📦 Frontend Setup"
cd frontend
cp -n .env.example .env
echo "✅ Frontend .env created"
npm install
cd ..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your Zoom credentials"
echo "2. Start PostgreSQL: docker-compose up -d"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. In one terminal: cd backend && npm run dev"
echo "5. In another: cd frontend && npm run dev"
echo "6. Open http://localhost:3000"
echo ""
echo "📖 For Zoom setup, see ZOOM_INTEGRATION.md"
