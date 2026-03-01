# ASTU Complaint System - Architecture Overview

## System Architecture

The ASTU Complaint System is a **3-tier web application** designed for university complaint management with modern security and scalability practices.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • PostgreSQL 15 │
│ • TypeScript    │    │ • JWT Auth      │    │ • Prisma ORM    │
│ • TailwindCSS   │    │ • Redis Cache    │    │ • Migrations    │
│ • Vite          │    │ • Nodemailer     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   External      │              │
         └──────────────►│   Services      │◄─────────────┘
                        │                 │
                        │ • Brevo SMTP    │
                        │ • Cloudinary    │
                        │ • Google Gemini │
                        └─────────────────┘
```

## Container Architecture (Docker)

The system runs on **Docker containers** with orchestrated services:

```yaml
Services:
├── nginx (Reverse Proxy)
│   ├── Port 80/443
│   └── SSL Termination
├── frontend (React)
│   ├── Nginx serving static files
│   └── React Router support
├── backend (Node.js API)
│   ├── Port 5000
│   └── Multi-stage build
├── postgres (Database)
│   ├── Port 5432 (internal)
│   └── Persistent volume
└── redis (Cache)
    ├── Port 6379 (internal)
    └── OTP + Session storage
```

## Network Security

- **Private Bridge Network**: `172.20.0.0/16` subnet
- **Internal Communication**: Services communicate via Docker DNS
- **External Exposure**: Only Nginx exposed to internet
- **Health Checks**: All services have health monitoring

## Data Flow

1. **User Request** → Nginx (Load Balancer)
2. **Static Assets** → Frontend Container
3. **API Calls** → Backend Container
4. **Authentication** → JWT + Redis Session
5. **Data Persistence** → PostgreSQL
6. **Cache Layer** → Redis (OTP, Rate Limits)
7. **External Services** → SMTP, Cloudinary, AI

## Security Layers

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: Student, Staff, Admin roles
- **Email Verification**: ASTU domain validation
- **OTP System**: 6-digit, 10-minute expiry, 3-strike rule

### Data Protection
- **Encryption**: TLS 1.3 for all communications
- **Password Hashing**: bcrypt with 12 rounds
- **Input Validation**: Express-validator middleware
- **SQL Injection Prevention**: Prisma ORM

### Infrastructure Security
- **Container Security**: Non-root users, minimal images
- **Network Isolation**: Private Docker network
- **Secrets Management**: Environment variables
- **Rate Limiting**: Express-rate-limit + Redis

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: Easy horizontal scaling
- **Load Balancer**: Nginx distributes traffic
- **Database**: Connection pooling via Prisma
- **Cache**: Redis cluster for high availability

### Performance Optimizations
- **Static Asset Caching**: 1-year cache headers
- **Gzip Compression**: Reduced bandwidth
- **Database Indexing**: Optimized queries
- **Lazy Loading**: Component-level code splitting

## Monitoring & Observability

### Health Checks
- **Application Health**: `/health` endpoint
- **Database Health**: PostgreSQL connection checks
- **Cache Health**: Redis ping checks
- **Container Health**: Docker health monitoring

### Logging Strategy
- **Structured Logging**: JSON format
- **Error Tracking**: Centralized error logging
- **Access Logs**: Nginx request logging
- **Security Events**: Failed auth attempts

## Deployment Architecture

### Production Environment
- **Container Orchestration**: Docker Compose
- **SSL/TLS**: Let's Encrypt certificates
- **Backup Strategy**: Database snapshots
- **CI/CD Pipeline**: Automated deployments

### Development Environment
- **Hot Reload**: Nodemon for backend
- **Development Server**: Vite for frontend
- **Database Seeding**: Test data generation
- **Local Development**: Docker Compose dev

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-------------|---------|
| **Frontend** | React 18 | UI Framework |
| | TypeScript | Type Safety |
| | TailwindCSS | Styling |
| | Vite | Build Tool |
| **Backend** | Node.js 18 | Runtime |
| | Express.js | Web Framework |
| | Prisma | ORM |
| | JWT | Authentication |
| **Database** | PostgreSQL 15 | Primary DB |
| | Redis 7 | Cache/Session |
| **Infrastructure** | Docker | Containerization |
| | Nginx | Reverse Proxy |
| | Brevo | Email Service |
| | Cloudinary | File Storage |
