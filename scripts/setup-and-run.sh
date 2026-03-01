#!/bin/bash

# ASTU Complaint System - Complete Setup Script
# This script handles complete environment setup and application startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_ENV_FILE="$PROJECT_ROOT/server/.env"

echo -e "${BLUE}🚀 ASTU Complaint System - Complete Setup${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if server env file exists
if [ ! -f "$SERVER_ENV_FILE" ]; then
    echo -e "${RED}❌ Error: server/.env file not found${NC}"
    echo -e "${YELLOW}Creating from template...${NC}"
    
    if [ -f "$PROJECT_ROOT/server/.env.docker" ]; then
        cp "$PROJECT_ROOT/server/.env.docker" "$SERVER_ENV_FILE"
        echo -e "${GREEN}✅ Created server/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit server/.env with your actual credentials${NC}"
        echo -e "${YELLOW}   Required: SMTP_*, GEMINI_API_KEY, CLOUDINARY_*${NC}"
        echo ""
        read -p "Press Enter to continue after editing server/.env..."
    else
        echo -e "${RED}❌ Template file not found${NC}"
        exit 1
    fi
fi

# Load environment variables
echo -e "${BLUE}📖 Loading environment variables...${NC}"
set -a
source "$SERVER_ENV_FILE"
set +a

# Verify critical variables are set
if [ -z "$DATABASE_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_PASSWORD not set, using default${NC}"
    export DATABASE_PASSWORD="astu123456"
fi

if [ -z "$DATABASE_NAME" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_NAME not set, using default${NC}"
    export DATABASE_NAME="astu_complaints"
fi

if [ -z "$DATABASE_USER" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_USER not set, using default${NC}"
    export DATABASE_USER="astu_user"
fi

# Export variables for docker-compose
export DATABASE_NAME DATABASE_USER DATABASE_PASSWORD
export JWT_SECRET JWT_EXPIRES_IN
export SMTP_HOST SMTP_USER SMTP_PASS EMAIL_FROM
export REDIS_PASSWORD
export GEMINI_API_KEY GEMINI_MODEL
export CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET
export FRONTEND_URL
export NODE_ENV=production
export RATE_LIMIT_WINDOW_MS=900000
export RATE_LIMIT_MAX_REQUESTS=100

# Override DATABASE_URL for Docker environment
export DATABASE_URL="postgresql://${DATABASE_USER:-astu_user}:${DATABASE_PASSWORD}@postgres:5432/${DATABASE_NAME:-astu_complaints}"

# Override REDIS_HOST for Docker environment
export REDIS_HOST=redis
export REDIS_PORT=6379

# Override FRONTEND_URL for Docker environment
export FRONTEND_URL="http://localhost:3000"

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker and try again${NC}"
    exit 1
fi

# Stop any existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true

# Build and start all services
echo -e "${BLUE}🏗️  Building and starting all services...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
docker compose up --build -d

# Wait for database to be ready
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
sleep 20

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
if docker compose exec -T backend npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Migration failed, trying Prisma client regeneration...${NC}"
    
    # Try to regenerate Prisma client first
    if docker compose exec -T backend npx prisma generate; then
        echo -e "${GREEN}✅ Prisma client regenerated${NC}"
        
        # Try migrations again
        if docker compose exec -T backend npx prisma migrate deploy; then
            echo -e "${GREEN}✅ Migrations completed successfully after regeneration${NC}"
        else
            echo -e "${RED}❌ Migration still failed${NC}"
            echo -e "${YELLOW}Checking container logs...${NC}"
            docker compose logs backend --tail=20
            exit 1
        fi
    else
        echo -e "${RED}❌ Prisma client regeneration failed${NC}"
        echo -e "${YELLOW}Checking container logs...${NC}"
        docker compose logs backend --tail=20
        exit 1
    fi
fi

# Seed the database
echo -e "${BLUE}🌱 Seeding database with initial data...${NC}"
if docker compose exec -T backend npm run db:seed; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Seeding failed or already seeded (this is normal)${NC}"
fi

# Verify all services are healthy
echo -e "${BLUE}🔍 Verifying service health...${NC}"
sleep 10

POSTGRES_HEALTH=$(docker compose ps postgres | grep -q "healthy" && echo "yes" || echo "no")
REDIS_HEALTH=$(docker compose ps redis | grep -q "healthy" && echo "yes" || echo "no")
BACKEND_HEALTH=$(docker compose ps backend | grep -q "healthy" && echo "yes" || echo "no")

if [ "$POSTGRES_HEALTH" = "yes" ]; then
    echo -e "${GREEN}✅ PostgreSQL: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL: Starting up...${NC}"
fi

if [ "$REDIS_HEALTH" = "yes" ]; then
    echo -e "${GREEN}✅ Redis: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Redis: Starting up...${NC}"
fi

if [ "$BACKEND_HEALTH" = "yes" ]; then
    echo -e "${GREEN}✅ Backend: Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend: Starting up...${NC}"
fi

# Show access information
echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${BLUE}🌐 Application is now running${NC}"
echo ""
echo -e "${YELLOW}📋 Access Information:${NC}"
echo -e "   🌐 Frontend: http://localhost"
echo -e "   🔧 Backend API: http://localhost/api"
echo -e "   📊 Health Check: http://localhost/api/health"
echo ""
echo -e "${YELLOW}🔧 Management Commands:${NC}"
echo -e "   📜 View logs: docker compose logs -f"
echo -e "   🛑 Stop app: docker compose down"
echo -e "   🔄 Restart: docker compose restart"
echo ""
echo -e "${YELLOW}📚 Documentation: ./docs/README.md${NC}"
echo -e "${YELLOW}👨‍💻 Developer: Samuel Girma - https://samgirma.app${NC}"
echo ""

# Show live logs
echo -e "${BLUE}📜 Showing live logs (Ctrl+C to exit logs, app continues running)${NC}"
docker compose logs -f
