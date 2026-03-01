#!/bin/bash

# ASTU Complaint System - Database Setup Script
# This script handles database initialization and seeding

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

echo -e "${BLUE}🗄️  ASTU Complaint System - Database Setup${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if server env file exists
if [ ! -f "$SERVER_ENV_FILE" ]; then
    echo -e "${RED}❌ Error: server/.env file not found${NC}"
    echo -e "${YELLOW}Please create server/.env with your environment variables${NC}"
    exit 1
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

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker and try again${NC}"
    exit 1
fi

# Check if containers are running
echo -e "${BLUE}🐳 Checking container status...${NC}"
if ! docker compose ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  PostgreSQL container is not running${NC}"
    echo -e "${BLUE}🚀 Starting PostgreSQL container...${NC}"
    docker compose up -d postgres
    echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
    sleep 10
fi

if ! docker compose ps redis | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Redis container is not running${NC}"
    echo -e "${BLUE}🚀 Starting Redis container...${NC}"
    docker compose up -d redis
    sleep 5
fi

echo -e "${GREEN}✅ Containers are running${NC}"
echo ""

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
            echo -e "${RED}❌ Migration still failed after regeneration${NC}"
            echo -e "${YELLOW}Try rebuilding the backend container:${NC}"
            echo -e "${YELLOW}docker compose down && docker compose up --build backend${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Prisma client regeneration failed${NC}"
        echo -e "${YELLOW}Please rebuild the backend container:${NC}"
        echo -e "${YELLOW}docker compose down && docker compose up --build backend${NC}"
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

# Verify database connection
echo -e "${BLUE}🔍 Verifying database connection...${NC}"
if docker compose exec -T postgres psql -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection verified${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo -e "${BLUE}📊 Database is ready for use${NC}"
echo -e "${YELLOW}💡 You can now start the application with: ./scripts/run-dev.sh${NC}"
