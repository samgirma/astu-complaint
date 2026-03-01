# ASTU Complaint System - Deployment Guide

## Production Deployment

### Prerequisites

#### System Requirements
- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum
- **Storage**: 100GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Docker-enabled
- **Network**: Static IP address
- **Domain**: Registered domain name

#### Software Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.25+
- **SSL Certificate**: Let's Encrypt or commercial

### Environment Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/astu-complaint
sudo chown $USER:$USER /opt/astu-complaint
cd /opt/astu-complaint
```

#### 2. Clone Repository
```bash
# Clone the application
git clone https://github.com/astu/complaint-system.git .

# Set correct permissions
chmod +x scripts/*.sh
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_NAME=astu_complaints
DATABASE_USER=astu_user
DATABASE_PASSWORD=your-secure-database-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# SMTP Configuration (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-api-key
EMAIL_FROM=noreply@astu.edu.et

# Redis Configuration
REDIS_PASSWORD=your-redis-password-optional

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Production
NODE_ENV=production
```

### SSL Certificate Setup

#### Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Manual SSL (Alternative)
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Set permissions
chmod 600 nginx/ssl/*
```

### Database Setup

#### PostgreSQL Initialization
```bash
# Create database initialization script
cat > server/init.sql << EOF
-- Create database
CREATE DATABASE astu_complaints;

-- Create user
CREATE USER astu_user WITH ENCRYPTED PASSWORD 'your-secure-database-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE astu_complaints TO astu_user;

-- Create extensions
\c astu_complaints;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
```

### Deployment Commands

#### 1. Build and Start Services
```bash
# Build all services
docker-compose build

# Start services in production mode
docker-compose up -d

# Check service status
docker-compose ps
```

#### 2. Database Migration
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Seed initial data (optional)
docker-compose exec backend npm run db:seed
```

#### 3. Create Admin User
```bash
# Create initial admin user
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin-temp-password', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@astu.edu.et',
      fullName: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user created:', admin.email);
}

createAdmin().catch(console.error);
"
```

### Service Verification

#### Health Checks
```bash
# Check all services
curl http://localhost/health

# Check backend API
curl http://localhost/api/health

# Check database connection
docker-compose exec backend npm run db:check

# Check Redis connection
docker-compose exec redis redis-cli ping
```

#### Log Monitoring
```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

## Maintenance & Operations

### Backup Strategy

#### Database Backups
```bash
#!/bin/bash
# backup.sh - Automated database backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
BACKUP_FILE="astu_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U astu_user astu_complaints > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### File Backups
```bash
#!/bin/bash
# backup-files.sh - Backup uploaded files

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Backup uploaded files
docker cp $(docker-compose ps -q backend):/app/uploads $BACKUP_DIR/uploads_${DATE}

# Compress
tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz -C $BACKUP_DIR uploads_${DATE}

# Cleanup
rm -rf $BACKUP_DIR/uploads_${DATE}
```

### Update Procedures

#### Application Updates
```bash
#!/bin/bash
# update.sh - Application update procedure

echo "Starting application update..."

# Pull latest code
git pull origin main

# Backup current version
docker-compose down
docker tag astu-backend:latest astu-backend:backup
docker tag astu-frontend:latest astu-frontend:backup

# Build and deploy
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Health check
sleep 30
if curl -f http://localhost/health; then
    echo "Update successful!"
else
    echo "Update failed, rolling back..."
    docker-compose down
    docker-compose up -d
    exit 1
fi
```

#### Dependency Updates
```bash
#!/bin/bash
# update-dependencies.sh - Update dependencies

# Backend dependencies
cd server
npm update
npm audit fix

# Frontend dependencies
cd ../client
npm update
npm audit fix

# Rebuild and deploy
cd ..
docker-compose build
docker-compose up -d
```

### Monitoring Setup

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor Docker containers
docker stats

# Check disk usage
df -h
docker system df
```

#### Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/astu-complaint << EOF
/opt/astu-complaint/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart nginx backend
    endscript
}
EOF
```

### Performance Optimization

#### Database Optimization
```bash
# Connect to database
docker-compose exec postgres psql -U astu_user -d astu_complaints

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM complaints WHERE status = 'OPEN';

# Create indexes for performance
CREATE INDEX CONCURRENTLY idx_complaints_status_created ON complaints(status, created_at DESC);

# Update statistics
ANALYZE;
```

#### Cache Optimization
```bash
# Monitor Redis usage
docker-compose exec redis redis-cli info memory

# Clear cache if needed
docker-compose exec redis redis-cli FLUSHDB

# Monitor cache hit rate
docker-compose exec redis redis-cli info stats
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs backend

# Check port conflicts
sudo netstat -tulpn | grep :80

# Check disk space
df -h

# Restart services
docker-compose restart
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U astu_user

# Check connection string
docker-compose exec backend env | grep DATABASE_URL

# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec backend npx prisma migrate deploy
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

#### Performance Issues
```bash
# Check system resources
htop
iotop

# Check Docker resources
docker stats

# Optimize database
docker-compose exec postgres psql -U astu_user -d astu_complaints -c "VACUUM ANALYZE;"
```

### Emergency Procedures

#### Complete System Restore
```bash
# Stop all services
docker-compose down

# Restore database
docker-compose up -d postgres
sleep 10
gunzip -c /opt/backups/latest_backup.sql.gz | docker-compose exec -T postgres psql -U astu_user -d astu_complaints

# Start all services
docker-compose up -d

# Verify system
curl http://localhost/health
```

#### Security Incident Response
```bash
# Change all secrets
openssl rand -base64 32  # New JWT secret
openssl rand -base64 32  # New database password

# Update environment
nano .env

# Restart services
docker-compose down
docker-compose up -d

# Force password reset for all users
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.updateMany({ data: { passwordChanged: false } });
"
```

## Scaling & High Availability

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    scale: 3  # Run 3 backend instances
    
  nginx:
    depends_on:
      - backend
    # Load balancing configuration
```

### Database Replication
```bash
# Setup read replica
docker-compose exec postgres psql -U astu_user -d astu_complaints -c "
CREATE USER astu_readonly WITH ENCRYPTED PASSWORD 'readonly-password';
GRANT CONNECT ON DATABASE astu_complaints TO astu_readonly;
GRANT USAGE ON SCHEMA public TO astu_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO astu_readonly;
"
```

### Load Balancing
```nginx
# nginx.conf with upstream load balancing
upstream backend {
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
    least_conn;
}
```

## Compliance & Auditing

### Audit Trail Setup
```bash
# Enable database logging
docker-compose exec postgres psql -U astu_user -d astu_complaints -c "
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_destination = 'csvlog';
SELECT pg_reload_conf();
"
```

### Security Audit Checklist
- [ ] SSL certificates valid
- [ ] Firewall configured
- [ ] User access reviewed
- [ ] Backup procedures tested
- [ ] Log rotation configured
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Database encryption enabled
- [ ] File permissions correct
- [ ] Monitoring alerts configured

### Compliance Reporting
```bash
# Generate usage report
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateReport() {
  const users = await prisma.user.count();
  const complaints = await prisma.complaint.count();
  const resolved = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
  
  console.log(\`Users: \${users}, Complaints: \${complaints}, Resolved: \${resolved}\`);
}

generateReport();
"
```

## Support & Contact

### Technical Support
- **Email**: support@astu.edu.et
- **Documentation**: https://docs.astu.edu.et
- **Issue Tracker**: https://github.com/astu/complaint-system/issues

### Emergency Contacts
- **System Administrator**: admin@astu.edu.et
- **Security Team**: security@astu.edu.et
- **Database Admin**: dba@astu.edu.et

### Service Level Agreement
- **Uptime**: 99.9% monthly
- **Response Time**: 4 hours for critical issues
- **Resolution Time**: 24 hours for critical issues
- **Maintenance Window**: Sunday 2:00-4:00 AM

---

**Note**: This deployment guide assumes you have administrative access to the server and basic knowledge of Docker and Linux system administration.
