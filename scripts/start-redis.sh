#!/bin/bash

# Redis Development Setup Script
# This script starts Redis using Docker for development

echo "🚀 Starting Redis for ASTU Complaint System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Redis container is already running
if docker ps | grep -q "astu-redis"; then
    echo "✅ Redis container is already running"
    echo "📍 Redis is available at localhost:6379"
    exit 0
fi

# Start Redis using docker-compose
echo "📦 Starting Redis container..."
docker-compose -f docker-compose.redis.yml up -d

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 5

# Check if Redis is responsive
if docker exec astu-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready and accepting connections"
    echo "📍 Redis is available at localhost:6379"
    echo "🔧 To stop Redis: docker-compose -f docker-compose.redis.yml down"
    echo "📊 To check Redis: docker exec astu-redis redis-cli info"
else
    echo "❌ Redis failed to start properly"
    echo "🔍 Check logs: docker logs astu-redis"
    exit 1
fi
