# ASTU Complaint System - Security Documentation

## Security Architecture Overview

The ASTU Complaint System implements defense-in-depth security with multiple layers of protection:

```
┌─────────────────────────────────────────────────────────┐
│                    Network Layer                        │
│  • TLS 1.3 Encryption                                    │
│  • Nginx Reverse Proxy                                   │
│  • Private Docker Network (172.20.0.0/16)               │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                        │
│  • JWT Authentication                                    │
│  • Role-Based Access Control (RBAC)                      │
│  • Input Validation & Sanitization                      │
│  • Rate Limiting                                         │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  • Encrypted Database (PostgreSQL)                      │
│  • Password Hashing (bcrypt, 12 rounds)                 │
│  • Redis Cache with Authentication                       │
│  • Secure File Storage (Cloudinary)                      │
└─────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### JWT Token Security

#### Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "cuid_...",
    "email": "firstname.lastname@astu.edu.et",
    "role": "STUDENT|STAFF|ADMIN",
    "iat": 1640995200,
    "exp": 1641600000
  }
}
```

#### Security Measures
- **Strong Secret**: Minimum 32 characters
- **Short Expiry**: 7 days token lifetime
- **Algorithm**: HS256 for server-side validation
- **Rotation**: Token refresh on sensitive actions

### Role-Based Access Control (RBAC)

#### Permission Matrix
| Action | STUDENT | STAFF | ADMIN |
|--------|---------|-------|-------|
| Create Complaint | ✅ | ❌ | ✅ |
| View Own Complaints | ✅ | ❌ | ✅ |
| View Department Complaints | ❌ | ✅ | ✅ |
| View All Complaints | ❌ | ❌ | ✅ |
| Update Complaint Status | Limited | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Manage Departments | ❌ | ❌ | ✅ |

#### Implementation
```javascript
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - insufficient permissions' 
      });
    }

    next();
  };
};
```

### Email Domain Validation

#### ASTU Email Enforcement
```javascript
const ASTU_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+@(astu|astust)\.edu\.et$/;

const validateASTUEmail = (email) => {
  if (!ASTU_EMAIL_REGEX.test(email)) {
    throw new Error('Email must be in format: firstname.lastname@astu.edu.et');
  }
  return true;
};
```

#### MX Record Validation
```javascript
const validateEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new Error('Domain does not have valid mail servers');
    }
    return true;
  } catch (error) {
    throw new Error('Unable to verify email domain');
  }
};
```

## OTP Security System

### 3-Strike Suspension Rule

#### Implementation Logic
```javascript
const verifyOTP = async (email, providedOTP) => {
  // Check if user is blocked
  const blocked = await isUserBlocked(email);
  if (blocked) {
    return { 
      success: false, 
      message: 'Account suspended due to too many failed attempts.',
      code: 'ACCOUNT_SUSPENDED'
    };
  }

  // Verify OTP
  const storedOTP = await redis.get(`otp:${email}`);
  if (storedOTP !== providedOTP) {
    const attempts = await incrementAttempts(email);
    const remaining = 3 - attempts;
    
    if (remaining === 0) {
      return { 
        success: false, 
        message: 'Account suspended for 24 hours.',
        code: 'ACCOUNT_SUSPENDED'
      };
    }
    
    return { 
      success: false, 
      message: `Invalid OTP. ${remaining} attempts remaining.`,
      remainingAttempts: remaining
    };
  }

  // Success - reset attempts
  await resetAttempts(email);
  return { success: true, message: 'OTP verified successfully' };
};
```

#### Redis Key Strategy
```javascript
// OTP storage (10 minutes)
await redis.setEx(`otp:${email}`, 600, otp);

// Failed attempts (24 hours)
await redis.incr(`attempts:${email}`);
await redis.expire(`attempts:${email}`, 86400);

// Resend cooldown (60 seconds)
await redis.setEx(`resend_cooldown:${email}`, 60, 'blocked');
```

### Rate Limiting

#### Multi-Layer Rate Limiting
```javascript
// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests from this IP'
});

// Authentication rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 auth attempts
  skipSuccessfulRequests: true
});

// OTP rate limit
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 OTP requests
  keyGenerator: (req) => req.body.email
});
```

## SMTP Security

### Brevo SMTP Configuration
```javascript
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // Use TLS
  tls: {
    rejectUnauthorized: false // Prevent handshake issues
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

### Email Security Features
- **TLS Encryption**: All emails encrypted in transit
- **Domain Validation**: Only ASTU domains allowed
- **Content Security**: HTML email sanitization
- **Rate Limiting**: Prevent email spam
- **Bounce Handling**: Invalid email detection

## Data Protection

### Password Security
```javascript
// bcrypt with 12 rounds
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password validation
const validatePassword = (password) => {
  const requirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  };
  
  // Validation logic...
  return { isValid: true, requirements };
};
```

### Database Security
```javascript
// Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

// SQL injection prevention via ORM
const complaints = await prisma.complaint.findMany({
  where: {
    studentId: req.user.id, // Parameterized
    status: { in: ['OPEN', 'IN_PROGRESS'] }
  }
});
```

### File Upload Security
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

## Network Security

### Docker Network Isolation
```yaml
networks:
  astu-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16  # Private network
```

### Nginx Security Headers
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;

# Hide server version
server_tokens off;

# Limit request size
client_max_body_size 10M;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

### TLS Configuration
```nginx
# SSL Configuration (for HTTPS)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Input Validation & Sanitization

### Request Validation
```javascript
const complaintValidation = [
  body('body')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Complaint must be 10-1000 characters')
    .escape(), // XSS protection
  body('staffDeptId')
    .isUUID()
    .withMessage('Valid department ID required')
    .escape()
];
```

### SQL Injection Prevention
```javascript
// Safe: Parameterized queries via Prisma
const user = await prisma.user.findUnique({
  where: { email: req.body.email }
});

// Unsafe: Never do this
// const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### XSS Prevention
```javascript
// Input sanitization
const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Output encoding
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
```

## Monitoring & Logging

### Security Event Logging
```javascript
// Log security events
const logSecurityEvent = (event, details) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: details.ip,
    userAgent: details.userAgent
  }));
};

// Usage
logSecurityEvent('LOGIN_FAILED', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
```

### Failed Authentication Tracking
```javascript
// Track failed login attempts
const trackFailedLogin = async (email, ip) => {
  const key = `failed_login:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour
  
  if (attempts >= 5) {
    await logSecurityEvent('ACCOUNT_LOCKED', { email, ip, attempts });
    // Lock account or notify admin
  }
};
```

## Compliance & Best Practices

### Data Privacy
- **Minimization**: Only collect necessary data
- **Retention**: Automatic cleanup of old data
- **Encryption**: Data encrypted at rest and in transit
- **Access Control**: Role-based data access

### Security Headers
```javascript
// Content Security Policy
const csp = "default-src 'self'; " +
           "script-src 'self' 'unsafe-inline'; " +
           "style-src 'self' 'unsafe-inline'; " +
           "img-src 'self' data: https:; " +
           "connect-src 'self' https://generativelanguage.googleapis.com";

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', csp);
  next();
});
```

### Secure Development Practices
- **Code Review**: All code reviewed for security
- **Dependency Updates**: Regular security updates
- **Penetration Testing**: Regular security testing
- **Vulnerability Scanning**: Automated security scans

### Backup & Recovery
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="astu_backup_${DATE}.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Encrypt backup
gpg --symmetric --cipher-algo AES256 $BACKUP_FILE

# Upload to secure storage
aws s3 cp $BACKUP_FILE.gpg s3://secure-backups/
```

## Incident Response

### Security Incident Procedure
1. **Detection**: Monitor security logs
2. **Assessment**: Evaluate impact and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats
5. **Recovery**: Restore services
6. **Lessons**: Document and improve

### Emergency Contacts
- **Security Team**: security@astu.edu.et
- **System Admin**: admin@astu.edu.et
- **Incident Response**: incident@astu.edu.et

### Security Checklist
- [ ] JWT secrets are strong and rotated
- [ ] Database access is restricted
- [ ] All inputs are validated
- [ ] Rate limiting is configured
- [ ] SSL certificates are valid
- [ ] Security headers are set
- [ ] Logs are monitored
- [ ] Backups are encrypted
- [ ] Dependencies are updated
- [ ] Penetration tests completed
