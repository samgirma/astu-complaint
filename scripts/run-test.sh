#!/bin/bash

# ASTU Complaint System - Docker Compose Test Runner
# This script runs docker-compose in attach mode using server/.env variables

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
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

echo -e "${BLUE}🚀 ASTU Complaint System - Test Runner${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if server env file exists
if [ ! -f "$SERVER_ENV_FILE" ]; then
    echo -e "${RED}❌ Error: server/.env file not found${NC}"
    echo -e "${YELLOW}Please create server/.env with your environment variables${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found configuration files${NC}"
echo -e "${YELLOW}📁 Using server/.env for environment variables${NC}"
echo -e "${YELLOW}📋 Using docker-compose.yml for service definition${NC}"
echo ""

# Load environment variables from server/.env
echo -e "${BLUE}📖 Loading environment variables...${NC}"
set -a
source "$SERVER_ENV_FILE"
set +a

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

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker and try again${NC}"
    exit 1
fi

# Check Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: docker compose is not available${NC}"
    echo -e "${YELLOW}Please install Docker Compose v2 or update Docker Desktop${NC}"
    exit 1
fi

echo -e "${BLUE}🐳 Starting services in attach mode...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker compose -f "$COMPOSE_FILE" down
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run docker compose in attach mode
docker compose -f "$COMPOSE_FILE" up --build --force-recreate
