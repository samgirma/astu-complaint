# ASTU Complaint System - Documentation

Welcome to the comprehensive documentation for the ASTU Complaint System. This system is a production-ready, university-grade complaint management platform built with modern security practices and scalable architecture.

## 📚 Documentation Structure

### [📐 Architecture](./architecture.md)
High-level system overview and technical architecture
- 3-tier application design
- Docker containerization
- Network security model
- Scalability considerations

### [⚙️ Services](./services.md)
Detailed service documentation and implementation
- Authentication & OTP system
- Complaint management workflow
- Notification system
- Email service integration
- AI-powered features
- Database and caching strategies

### [🔧 Implementation](./implementation.md)
Technical implementation details
- Database schema and relationships
- Complete API reference
- Redis key strategies
- Environment variables
- Error handling patterns
- File upload system
- Testing strategies

### [🔒 Security](./security.md)
Comprehensive security documentation
- Authentication & authorization
- RBAC implementation
- OTP security system
- Rate limiting strategies
- SMTP security
- Data protection measures
- Network security
- Compliance requirements

### [🚀 Deployment](./deployment.md)
Production deployment guide
- Server setup and prerequisites
- SSL certificate configuration
- Database initialization
- Backup and recovery procedures
- Maintenance operations
- Troubleshooting guide
- Scaling and high availability

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)

### Local Development
```bash
# Clone the repository
git clone https://github.com/astu/complaint-system.git
cd complaint-system

# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# API Documentation: http://localhost:5000/api
```

### Production Deployment
```bash
# Configure production environment
cp .env.production .env
# Edit .env with your production values

# Deploy with SSL
docker-compose up -d

# Setup SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🏗️ System Overview

The ASTU Complaint System is a comprehensive complaint management platform designed for universities with the following key features:

### Core Features
- **Secure Authentication**: JWT-based auth with OTP verification
- **Role-Based Access**: Student, Staff, and Admin roles
- **Complaint Management**: Complete complaint lifecycle tracking
- **File Attachments**: Multi-file upload with cloud storage
- **Real-time Notifications**: In-app and email notifications
- **AI Integration**: Smart complaint categorization
- **Advanced Security**: Rate limiting, suspension logic, encryption

### Technical Stack
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Node.js 18, Express.js, Prisma ORM
- **Database**: PostgreSQL 15 with Redis caching
- **Infrastructure**: Docker, Nginx, Cloudinary
- **Communication**: Brevo SMTP, Google Gemini AI

### Security Features
- **Email Domain Validation**: Only ASTU institutional emails
- **3-Strike OTP Rule**: Account suspension after failed attempts
- **Rate Limiting**: Multi-layer request throttling
- **Data Encryption**: TLS 1.3, bcrypt password hashing
- **Input Validation**: Comprehensive sanitization
- **Audit Logging**: Security event tracking

## 📊 System Metrics

### Performance
- **Response Time**: <200ms for API calls
- **Uptime**: 99.9% availability target
- **Concurrent Users**: 1000+ supported
- **File Upload**: 10MB per file, 5 files max

### Security
- **Authentication**: JWT with 7-day expiry
- **OTP System**: 6-digit, 10-minute expiry
- **Rate Limits**: 100 requests/15 minutes
- **Encryption**: AES-256 for data at rest

## 🔧 Configuration

### Environment Variables
Key environment variables that need to be configured:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
JWT_SECRET="your-32-character-secret-key"

# Email Service
SMTP_HOST="smtp-relay.brevo.com"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-smtp-api-key"

# External Services
GEMINI_API_KEY="your-gemini-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### Docker Services
- **nginx**: Reverse proxy and SSL termination
- **frontend**: React application served by Nginx
- **backend**: Node.js API server
- **postgres**: PostgreSQL database
- **redis**: Redis cache and session storage

## 🛡️ Security Model

Our security model follows defense-in-depth principles:

1. **Network Layer**: TLS encryption, private Docker network
2. **Application Layer**: JWT auth, RBAC, input validation
3. **Data Layer**: Encrypted database, secure file storage
4. **Infrastructure**: Container security, secrets management

### Authentication Flow
1. User registers with ASTU email
2. OTP sent to email for verification
3. JWT token issued upon successful verification
4. Token used for subsequent API calls
5. Role-based access control enforced

### Data Protection
- **Personal Data**: Encrypted at rest and in transit
- **File Storage**: Cloudinary CDN with signed URLs
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis with authentication

## 📈 Scalability

The system is designed for horizontal scaling:

- **Stateless Backend**: Easy horizontal scaling
- **Load Balancer**: Nginx distributes traffic
- **Database**: Connection pooling and read replicas
- **Cache**: Redis cluster for high availability
- **CDN**: Cloudinary for global file delivery

## 🔄 Development Workflow

### Code Organization
```
astu-complaint/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
│   └── Dockerfile
├── server/               # Node.js backend
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── routes/         # API routes
│   ├── models/         # Prisma models
│   └── Dockerfile
├── nginx/               # Nginx configuration
├── docs/               # Documentation
└── docker-compose.yml  # Orchestration
```

### Git Workflow
1. **Feature Branches**: `feature/new-feature`
2. **Development**: `develop` branch
3. **Production**: `main` branch
4. **Pull Requests**: Code review required
5. **CI/CD**: Automated testing and deployment

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Service and utility functions
- **Integration Tests**: API endpoints
- **E2E Tests**: Critical user journeys
- **Security Tests**: Authentication and authorization

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📞 Support

### Getting Help
- **Documentation**: This comprehensive guide
- **Issue Tracker**: GitHub issues for bug reports
- **Community**: Developer discussion forum
- **Email**: support@astu.edu.et

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Reporting Issues
When reporting issues, please include:
- System information (OS, Docker version)
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with university SIS
- [ ] Multi-language support
- [ ] Advanced workflow automation

### Technical Improvements
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced monitoring
- [ ] Machine learning integration

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainers**: ASTU Development Team
