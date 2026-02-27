# 🐳 ASTU Complaint System - Docker Deployment

Complete containerization setup for ASTU Smart Complaint & Issue Tracking System with PostgreSQL, Redis, and Nginx.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx      │    │   Frontend    │    │   Backend      │
│  (Port 80)   │────│  (Port 3000) │────│  (Port 5000) │
│               │    │               │    │               │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ PostgreSQL     │
                    │ (Port 5432)  │
                    │               │
                    └─────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Docker & Docker Compose
- Git

### **1. Clone Repository**
```bash
git clone <repository-url>
cd astu-complaint-system
```

### **2. Environment Setup**
```bash
# Create environment file
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
```env
# AI & External Services
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Database (auto-configured)
POSTGRES_DB=astu_complaints
POSTGRES_USER=astu_user
POSTGRES_PASSWORD=astu_password

# Application
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

### **3. Start Services**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **4. Access Applications**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Nginx Proxy**: http://localhost:80
- **Database**: localhost:5432 (with your credentials)

## 📋 Services Details

### **🐘 PostgreSQL Database**
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: astu_complaints
- **User**: astu_user
- **Password**: astu_password
- **Volume**: Persistent data storage
- **Health Check**: Automated connectivity checks

### **🔴 Redis Cache**
- **Image**: redis:7-alpine
- **Port**: 6379
- **Purpose**: Session storage, caching
- **Volume**: Persistent data

### **🟢 Backend Server**
- **Base**: Node.js 18 Alpine
- **Port**: 5000
- **Environment**: Production mode
- **Features**:
  - Prisma ORM
  - JWT Authentication
  - File uploads
  - AI Integration
  - Health checks

### **🔵 Frontend Client**
- **Base**: Multi-stage build (Node.js + Nginx)
- **Port**: 3000 (via Nginx: 80)
- **Features**:
  - React 18
  - TypeScript
  - Tailwind CSS
  - Optimized build

### **🌐 Nginx Reverse Proxy**
- **Image**: nginx:alpine
- **Port**: 80, 443
- **Features**:
  - SSL termination
  - Gzip compression
  - Rate limiting
  - Security headers
  - Static file caching
  - API proxying

## 🔧 Configuration

### **Environment Variables**
```yaml
services:
  backend:
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://astu_user:astu_password@postgres:5432/astu_complaints
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      # ... other variables
```

### **Volume Management**
```yaml
volumes:
  postgres_data:    # Database persistence
  redis_data:       # Redis persistence
  ./uploads:        # File uploads
```

### **Network Configuration**
- **Network**: astu-network (bridge)
- **Isolation**: Services communicate internally
- **Ports**: Exposed to host as needed

## 🛠️ Development Workflow

### **Local Development**
```bash
# Start only database
docker-compose up -d postgres redis

# Run backend locally
cd server
npm run dev

# Run frontend locally
cd client
npm run dev
```

### **Full Docker Development**
```bash
# Rebuild on changes
docker-compose up --build

# Watch logs
docker-compose logs -f backend

# Execute in container
docker-compose exec backend sh
```

## 🔍 Monitoring & Health Checks

### **Health Endpoints**
- **Backend**: `GET /health`
- **Frontend**: `GET /health` (Nginx)
- **Database**: PostgreSQL ping

### **Health Check Status**
```bash
# Check all services
docker-compose ps

# Check specific service health
docker-compose ps backend
docker-compose ps postgres
```

### **Logs Management**
```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f backend

# Export logs
docker-compose logs --no-color > app.log
```

## 🔒 Security Features

### **Container Security**
- **Non-root users**: All containers run as non-root
- **Minimal images**: Alpine Linux variants
- **Read-only filesystem**: Where possible
- **Resource limits**: Configured limits

### **Network Security**
- **Internal network**: Services isolated in bridge network
- **Port exposure**: Only necessary ports exposed
- **SSL/TLS**: Ready for HTTPS configuration

### **Application Security**
- **Environment variables**: Sensitive data in env files
- **JWT secrets**: Proper secret management
- **Rate limiting**: Nginx and application level
- **Security headers**: CSP, XSS protection, etc.

## 📊 Performance Optimization

### **Build Optimization**
- **Multi-stage builds**: Minimal final images
- **Layer caching**: Docker layer optimization
- **.dockerignore**: Exclude unnecessary files

### **Runtime Optimization**
- **Nginx caching**: Static asset caching
- **Gzip compression**: Response compression
- **Connection pooling**: Database connection management

### **Resource Management**
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## 🔄 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          docker-compose down
          docker-compose pull
          docker-compose up -d --build
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check database health
docker-compose exec postgres pg_isready -U astu_user -d astu_complaints

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### **Backend Not Starting**
```bash
# Check logs
docker-compose logs backend

# Enter container
docker-compose exec backend sh

# Check environment
docker-compose exec backend env | grep DATABASE_URL
```

#### **Frontend Not Loading**
```bash
# Check Nginx config
docker-compose exec nginx nginx -t

# Reload Nginx
docker-compose exec nginx nginx -s reload
```

### **Performance Issues**
```bash
# Monitor resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

## 📈 Scaling

### **Horizontal Scaling**
```yaml
# Multiple backend instances
services:
  backend:
    deploy:
      replicas: 3

# Load balancer configuration
  nginx:
    # Configure upstream servers
```

### **Vertical Scaling**
```yaml
# Increase resources
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## 🔧 Maintenance

### **Backup Strategy**
```bash
# Database backup
docker-compose exec postgres pg_dump -U astu_user astu_complaints > backup.sql

# Volume backup
docker run --rm -v astu_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .
```

### **Updates**
```bash
# Pull latest images
docker-compose pull

# Recreate with new images
docker-compose up -d --force-recreate
```

## 🌍 Production Deployment

### **Production Environment**
```bash
# Production compose file
docker-compose -f docker-compose.prod.yml up -d

# With environment file
docker-compose --env-file .env.prod up -d
```

### **SSL Configuration**
```bash
# Place SSL certificates
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/
cp your-key.pem nginx/ssl/

# Update nginx config for HTTPS
# Edit nginx/nginx.conf
```

## 📝 Development Tips

### **Hot Reloading**
```bash
# Development with hot reload
docker-compose up --build

# Watch specific service
docker-compose up --build backend
```

### **Debugging**
```bash
# Debug mode
docker-compose run --rm backend sh

# Check network connectivity
docker-compose exec backend ping postgres
```

## 🆘 Support

For Docker-related issues:
1. Check service logs: `docker-compose logs`
2. Verify environment variables
3. Check network connectivity
4. Review resource usage: `docker stats`

## 📄 License

This Docker configuration is licensed under the MIT License.
