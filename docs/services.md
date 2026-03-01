# ASTU Complaint System - Services Documentation

## Authentication Service

### OTP Verification System
The OTP service provides secure email-based verification with Redis-backed storage and rate limiting.

#### Key Features
- **6-digit OTP**: Cryptographically secure random generation
- **10-minute TTL**: Automatic expiration
- **3-Strike Rule**: Account suspension after 3 failed attempts
- **24-hour Suspension**: Temporary block for security
- **60-second Cooldown**: Prevent spam requests

#### Implementation Details
```javascript
// Redis Key Strategy
otp:${email}           // OTP storage (600s TTL)
attempts:${email}     // Failed attempts (86400s TTL)
resend_cooldown:${email} // Resend prevention (60s TTL)
```

#### API Endpoints
- `POST /api/auth/otp/send-otp` - Generate and send OTP
- `POST /api/auth/otp/verify-otp` - Verify OTP code
- `GET /api/auth/otp/status` - Check remaining attempts

#### Security Measures
- **ASTU Email Validation**: Only `@astu.edu.et` domains
- **MX Record Validation**: Verify email domain
- **Rate Limiting**: Redis-based attempt tracking
- **Suspension Logic**: Automatic account blocking

### JWT Authentication
Stateless token-based authentication with role-based access control.

#### Token Structure
```json
{
  "userId": "uuid",
  "email": "user@astu.edu.et",
  "role": "STUDENT|STAFF|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

#### Role Permissions
- **STUDENT**: Create/view own complaints
- **STAFF**: View department complaints, update status
- **ADMIN**: Full system access, user management

## Complaint Service

### State Machine Implementation
Complaints follow a strict state transition pattern:

```
[OPEN] → [IN_PROGRESS] → [RESOLVED]
   ↑           ↓             ↓
   └───────[STUDENT]←──────┘
```

#### State Transitions
- **OPEN → IN_PROGRESS**: Staff action required
- **IN_PROGRESS → RESOLVED**: Staff marks as complete
- **RESOLVED → OPEN/IN_PROGRESS**: Student rejection

#### Business Logic
- **24-hour Warning**: Stale OPEN complaints
- **7-week Escalation**: Overdue complaints
- **3-day Confirmation**: Student response window

### File Upload System
Multi-file attachment support with Cloudinary integration.

#### Features
- **10MB Limit**: Per file size restriction
- **5 Files Max**: Per complaint limit
- **Type Validation**: Images, PDFs, documents
- **Cloud Storage**: Cloudinary CDN delivery

#### Supported Formats
```
Images: jpeg, jpg, png, gif
Documents: pdf, doc, docx, txt
```

## Notification Service

### Real-time Notifications
In-app notification system with role-based delivery.

#### Notification Types
- **NEW_COMPLAINT**: New complaint submissions
- **STATUS_UPDATE**: Complaint status changes
- **ADMIN_WARNING**: System alerts
- **STUDENT_DISPUTE**: Resolution conflicts

#### Delivery Mechanisms
- **Database Storage**: Persistent notification records
- **Real-time Updates**: WebSocket connections
- **Email Integration**: Critical alerts via SMTP

### Warning System
Automated escalation system for complaint management.

#### Warning Triggers
1. **Stale Complaints**: >24 hours in OPEN status
2. **Overdue Complaints**: >7 weeks pending
3. **Unconfirmed Resolutions**: >3 days without student response

#### Escalation Flow
```javascript
1. Detect violation condition
2. Generate warning message
3. Notify relevant staff department
4. Log warning for audit trail
5. Schedule follow-up checks
```

## Email Service

### SMTP Integration
Production-ready email delivery using Brevo SMTP service.

#### Configuration
```javascript
{
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}
```

#### Email Templates
- **OTP Verification**: 6-digit code delivery
- **Welcome Email**: Account creation notification
- **Password Reset**: Secure reset links
- **System Alerts**: Administrative notifications

#### Security Features
- **TLS Encryption**: Secure SMTP transmission
- **Domain Validation**: ASTU email verification
- **Rate Limiting**: Prevent email spam
- **Bounce Handling**: Invalid email detection

## AI Integration Service

### Google Gemini AI
AI-powered complaint analysis and response suggestions.

#### Capabilities
- **Complaint Categorization**: Automatic department assignment
- **Priority Assessment**: Urgency level detection
- **Response Suggestions**: Staff assistance
- **Sentiment Analysis**: Emotional tone detection

#### Implementation
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
});
```

#### Usage Patterns
- **Text Analysis**: Natural language processing
- **Classification**: Category assignment
- **Recommendation**: Response generation
- **Summarization**: Complaint overview

## Database Service

### Prisma ORM
Type-safe database access with automatic migrations.

#### Schema Design
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  fullName        String
  password        String    @hidden
  role            Role
  staffDeptId     String?   @relation
  staffDepartment StaffDepartment? @relation(fields: [staffDeptId], references: [id])
  // ... relations
}

model Complaint {
  id              String    @id @default(cuid())
  body            String
  status          Status    @default(OPEN)
  studentId       String
  staffDeptId     String
  // ... relations and timestamps
}
```

#### Data Relationships
- **User → Complaints**: One-to-many
- **Department → Complaints**: One-to-many
- **User → Notifications**: One-to-many
- **Complaint → Files**: One-to-many

### Redis Cache Service
High-performance caching and session management.

#### Use Cases
- **OTP Storage**: Temporary verification codes
- **Session Management**: User session data
- **Rate Limiting**: Request throttling
- **Cache Layer**: Frequently accessed data

#### Data Structures
```javascript
// String: OTP storage
await redis.setEx(`otp:${email}`, 600, otp);

// Hash: User session
await redis.hSet(`session:${userId}`, {
  role: 'STUDENT',
  deptId: 'dept-123',
  lastSeen: Date.now()
});

// Sorted Set: Rate limiting
await redis.zAdd(`rate_limit:${ip}`, [
  { score: Date.now(), value: 'request-1' }
]);
```

## File Storage Service

### Cloudinary Integration
Cloud-based file storage with CDN delivery.

#### Features
- **Auto-optimization**: Image compression
- **Format Conversion**: Automatic file optimization
- **CDN Delivery**: Global content distribution
- **Security**: Signed URLs for private files

#### Upload Process
```javascript
// 1. Receive file upload
const file = req.file;

// 2. Upload to Cloudinary
const result = await cloudinary.uploader.upload(file.buffer, {
  folder: 'complaints',
  resource_type: 'auto',
  format: 'auto',
  quality: 'auto'
});

// 3. Store reference in database
await prisma.attachment.create({
  data: {
    url: result.secure_url,
    publicId: result.public_id,
    complaintId: complaintId
  }
});
```

## Security Service

### Input Validation
Comprehensive validation using express-validator.

#### Validation Rules
```javascript
const complaintValidation = [
  body('body')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Complaint must be 10-1000 characters'),
  body('staffDeptId')
    .isUUID()
    .withMessage('Valid department ID required')
];
```

#### Sanitization
- **XSS Prevention**: Input sanitization
- **SQL Injection**: Parameterized queries
- **File Validation**: Type and size checks
- **Email Validation**: Domain verification

### Rate Limiting Service
Multi-layer rate limiting for API protection.

#### Implementation
```javascript
// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests'
});

// Auth-specific limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 auth attempts
  skipSuccessfulRequests: true
});
```

#### Limit Types
- **Global**: 100 requests/15 minutes
- **Authentication**: 5 attempts/15 minutes
- **OTP**: 3 attempts/24 hours
- **File Upload**: 10 uploads/hour
