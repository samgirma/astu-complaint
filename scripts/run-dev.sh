#!/bin/bash

# ASTU Complaint System - Development Runner
# This script runs docker-compose in attach mode using server/.env for development

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
DEV_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

echo -e "${BLUE}🛠️  ASTU Complaint System - Development Runner${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if server env file exists
if [ ! -f "$SERVER_ENV_FILE" ]; then
    echo -e "${RED}❌ Error: server/.env file not found${NC}"
    echo -e "${YELLOW}Please create server/.env with your environment variables${NC}"
    exit 1
fi

# Check if docker-compose.dev.yml exists
if [ ! -f "$DEV_COMPOSE_FILE" ]; then
    echo -e "${YELLOW}⚠️  docker-compose.dev.yml not found, using production docker-compose.yml${NC}"
    DEV_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
fi

echo -e "${GREEN}✅ Found configuration files${NC}"
echo -e "${YELLOW}📁 Using server/.env for environment variables${NC}"
echo -e "${YELLOW}📋 Using $(basename "$DEV_COMPOSE_FILE") for service definition${NC}"
echo ""

# Load environment variables from server/.env
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
export NODE_ENV=development
export RATE_LIMIT_WINDOW_MS=900000
export RATE_LIMIT_MAX_REQUESTS=100

# Override DATABASE_URL for Docker environment
export DATABASE_URL="postgresql://${DATABASE_USER:-astu_user}:${DATABASE_PASSWORD}@postgres:5432/${DATABASE_NAME:-astu_complaints}"

# Override REDIS_HOST for Docker environment
export REDIS_HOST=redis
export REDIS_PORT=6379

# Override FRONTEND_URL for Docker environment
export FRONTEND_URL="http://localhost:3000"

echo -e "${GREEN}✅ Environment variables loaded and exported${NC}"
echo -e "${BLUE}🔍 Key variables:${NC}"
echo -e "   DATABASE_NAME: ${DATABASE_NAME:-not set}"
echo -e "   DATABASE_USER: ${DATABASE_USER:-not set}"
echo -e "   NODE_ENV: ${NODE_ENV:-not set}"
echo -e "   FRONTEND_URL: ${FRONTEND_URL:-not set}"
echo ""

# Check Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: docker compose is not available${NC}"
    echo -e "${YELLOW}Please install Docker Compose v2 or update Docker Desktop${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Starting development services in attach mode...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping development services...${NC}"
    docker compose -f "$DEV_COMPOSE_FILE" down
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run docker compose in attach mode
docker compose -f "$DEV_COMPOSE_FILE" up --build --force-recreate
