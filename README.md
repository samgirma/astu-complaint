<div align="center">

# 🎓 **ASTU Smart Complaint System**

*A modern, secure, and intelligent university complaint management platform built for the digital age*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0+-red)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue)](https://www.docker.com/)

> 🚀 **Transforming university complaint handling with AI-powered insights and military-grade security**

> 💡 **Built by [Samuel Girma](https://samgirma.app) - 3rd Year Software Engineering Student at ASTU**

---

## 🎬 **Visuals & Demo**

![ASTU Complaint System Screenshot](https://res.cloudinary.com/dk3iqdf6b/image/upload/v1772353012/Screenshot_2026-03-01_11.15.54_AM_hspqpl.png)

*Experience the future of university complaint management with our intuitive interface*

<br>

[<img src="https://img.shields.io/badge/Live_Demo-4285F4?style=for-the-badge&logo=web&logoColor=white" alt="Live Demo">](https://your-domain.com)
[<img src="https://img.shields.io/badge/View_Documentation-00C851?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Documentation">](./docs/README.md)
[<img src="https://img.shields.io/badge/Developer_Portfolio-FF6B6B?style=for-the-badge&logo=github&logoColor=white" alt="Portfolio">](https://samgirma.app)

---

## 🛠️ **Tech Stack & Colors**

| Technology | Icon | Color | Purpose |
|------------|-------|-------|---------|
| **React 18** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white) | #61DAFB | Frontend Framework |
| **Tailwind CSS** | ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white) | #06B6D4 | Styling Framework |
| **Node.js** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | #339933 | Backend Runtime |
| **PostgreSQL** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white) | #336791 | Primary Database |
| **Redis** | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white) | #DC382D | Cache & Sessions |
| **Brevo** | ![Brevo](https://img.shields.io/badge/Brevo-00A4E4?style=flat&logo=sendinblue&logoColor=white) | #00A4E4 | Email Service |

---

## 🚨 **Security Highlights**

> [!IMPORTANT] 
> **🔒 Military-Grade Security**: Our system implements a 3-strike OTP suspension with 24-hour Redis-based account blocking, ensuring only legitimate users gain access.

> [!TIP] 
> **📧 ASTU-Only Authentication**: Strict email validation enforces `@astu.edu.et` domain registration with MX record verification.

---

## ⭐ **Key Features**

### 🎯 **Core Capabilities**

- 🎭 **Multi-role Dashboard** - Student, Staff, and Admin interfaces with role-based access control
- 🔐 **Real-time OTP Verification** - 6-digit codes with 10-minute expiry and anti-spam protection
- 🏢 **Department-based Routing** - Intelligent complaint assignment to appropriate university departments
- ✨ **Glassmorphism UI** - Modern, accessible interface with backdrop-blur effects
- 🤖 **AI-Powered Insights** - Google Gemini integration for smart complaint categorization
- 📊 **Real-time Analytics** - Comprehensive dashboard with complaint statistics and trends

### 🛡️ **Security Features**

- 🔒 **JWT Authentication** - Stateless token-based auth with 7-day expiry
- 🚫 **Rate Limiting** - Multi-layer protection against spam and abuse
- 📧 **Secure Email** - Brevo SMTP with TLS encryption
- 🗃️ **Data Encryption** - AES-256 encryption for sensitive data
- 🚦 **Audit Logging** - Comprehensive security event tracking

---

## 🏗️ **System Architecture**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[Tailwind CSS]
        B --> C[TypeScript]
    end
    
    subgraph "Infrastructure Layer"
        D[Nginx Proxy] --> E[Docker Containers]
        E --> F[PostgreSQL DB]
        E --> G[Redis Cache]
    end
    
    subgraph "Service Layer"
        H[Node.js API] --> I[JWT Auth]
        H --> J[OTP Service]
        H --> K[Email Service]
        H --> L[AI Service]
    end
    
    subgraph "External Services"
        M[Brevo SMTP]
        N[Cloudinary CDN]
        O[Google Gemini AI]
    end
    
    A --> D
    D --> H
    J --> M
    K --> M
    L --> O
    H --> N
    H --> F
    H --> G
```

### 📁 **Documentation Structure**

```
docs/
├── 📖 README.md              # Main documentation hub
├── 🏗️ architecture.md        # System architecture overview
├── ⚙️ services.md           # Service documentation
├── 🔧 implementation.md     # Technical implementation
├── 🔒 security.md          # Security documentation
└── 🚀 deployment.md        # Deployment guide
```

---

## 🚀 **Quick Start**

### 📋 **Prerequisites**

- Docker 20.10+ and Docker Compose v2
- Node.js 18+ (for local development)
- Git for version control

### ⚡ **One-Command Deployment**

```bash
# Clone the repository
git clone https://github.com/astu/complaint-system.git
cd complaint-system

# Configure environment
cp .env.production server/.env
# Edit server/.env with your credentials

# Launch with Docker Compose
docker compose up --build

# 🎉 Access your system at http://localhost
```

### 🔧 **Development Mode**

```bash
# Use our custom scripts
./scripts/run-dev.sh    # Development environment
./scripts/run-test.sh   # Production test mode
```

---

## 📂 **Project Structure**

```
astu-complaint/
├── 🎨 client/                    # React Frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/              # Application pages
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   └── Dockerfile             # Frontend container
├── 🖥️ server/                   # Node.js Backend
│   ├── controllers/           # API route handlers
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── routes/               # API endpoints
│   ├── models/               # Prisma models
│   ├── config/               # Configuration files
│   └── Dockerfile           # Backend container
├── 🐳 docker-compose.yml          # Service orchestration
├── 🌐 nginx/                     # Nginx configuration
├── 📚 docs/                      # Comprehensive documentation
├── 🔧 scripts/                    # Utility scripts
└── 📄 .env.production            # Environment template
```

---

## 🎯 **Key Configuration**

### 🔐 **Security Settings**

```bash
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# SMTP Configuration
SMTP_HOST="smtp-relay.brevo.com"
SMTP_USER="your-brevo-email@example.com"
SMTP_PASS="your-brevo-smtp-api-key"

# Redis Configuration
REDIS_PASSWORD="your-redis-password"
```

### 🏗️ **Database Setup**

```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://astu_user:password@postgres:5432/astu_complaints"

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Seed initial data
docker compose exec backend npm run db:seed
```

---

## 🤝 **Contributors & License**

### 👥 **Lead Developer**

<div align="center">

**👨‍💻 Samuel Girma**  
*3rd Year Software Engineering Student*  
*[Adama Science and Technology University (ASTU)](https://astu.edu.et)*

[![Portfolio](https://img.shields.io/badge/Portfolio-FF6B6B?style=for-the-badge&logo=web&logoColor=white)](https://samgirma.app)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/samgirma)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/samgirma)

**🎯 Specializing in:**
- 🌐 Full-Stack Web Development
- 🤖 AI Integration & Machine Learning
- 🐳 Containerization & DevOps
- 🔒 Security & Authentication Systems
- 📱 Modern UI/UX Design

</div>

### 📜 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📞 **Support & Community**

- 📧 **Email**: samuel.girma@astu.edu.et
- 🌐 **Portfolio**: [samgirma.app](https://samgirma.app)
- 📚 **Documentation**: [Complete Guide](./docs/README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/astu/complaint-system/issues)
- 💬 **Discussions**: [Community Forum](https://github.com/astu/complaint-system/discussions)

---

## 🗺️ **Roadmap**

### 🚀 **Upcoming Features**

- [ ] 📱 **Mobile Application** - React Native companion app
- [ ] 🧠 **Advanced Analytics** - Machine learning insights
- [ ] 🌍 **Multi-language Support** - Amharic and other local languages
- [ ] 🔗 **SIS Integration** - Student Information System connectivity
- [ ] 🤖 **Enhanced AI** - Advanced complaint analysis

### 🛠️ **Technical Improvements**

- [ ] **GraphQL API** - Modern query language
- [ ] **Microservices** - Scalable architecture
- [ ] **Kubernetes** - Container orchestration
- [ ] **Advanced Monitoring** - Real-time system health

---

<div align="center">

**🎓 Transforming university complaint management, one issue at a time**

*Built with ❤️ by [Samuel Girma](https://samgirma.app) - Software Engineering Student at ASTU*

[![Built with Love](https://img.shields.io/badge/Built%20with-%E2%9D%8C%9F-red?style=for-the-badge)](https://samgirma.app)

</div>
