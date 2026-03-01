# ASTU Complaint System - Implementation Guide

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN')) NOT NULL,
  staff_dept_id TEXT REFERENCES staff_departments(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  password_changed BOOLEAN DEFAULT false,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Staff Departments Table
```sql
CREATE TABLE staff_departments (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Complaints Table
```sql
CREATE TABLE complaints (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  student_id TEXT NOT NULL REFERENCES users(id),
  staff_dept_id TEXT NOT NULL REFERENCES staff_departments(id),
  resolver_id TEXT REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Attachments Table
```sql
CREATE TABLE attachments (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  complaint_id TEXT NOT NULL REFERENCES complaints(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_staff_dept ON users(staff_dept_id);

-- Complaint indexes
CREATE INDEX idx_complaints_student_id ON complaints(student_id);
CREATE INDEX idx_complaints_staff_dept_id ON complaints(staff_dept_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
Register a new student account.

**Request:**
```json
{
  "email": "firstname.lastname@astu.edu.et",
  "password": "SecurePass123!",
  "fullName": "First Last"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "user": {
      "id": "cuid...",
      "email": "firstname.lastname@astu.edu.et",
      "fullName": "First Last",
      "role": "STUDENT"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request:**
```json
{
  "email": "firstname.lastname@astu.edu.et",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cuid...",
      "email": "firstname.lastname@astu.edu.et",
      "fullName": "First Last",
      "role": "STUDENT",
      "staffDepartment": null
    },
    "token": "jwt_token_here"
  }
}
```

### OTP Endpoints

#### POST /api/auth/otp/send-otp
Send OTP verification code to email.

**Request:**
```json
{
  "email": "firstname.lastname@astu.edu.et"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "email": "firstname.lastname@astu.edu.et",
    "remainingAttempts": 3,
    "cooldownActive": true
  }
}
```

#### POST /api/auth/otp/verify-otp
Verify OTP code.

**Request:**
```json
{
  "email": "firstname.lastname@astu.edu.et",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "email": "firstname.lastname@astu.edu.et",
    "verified": true
  }
}
```

### Complaint Endpoints

#### POST /api/complaints
Create a new complaint (Student only).

**Request:**
```json
{
  "body": "Complaint description here...",
  "staffDeptId": "department_cuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "complaint": {
      "id": "cuid...",
      "body": "Complaint description here...",
      "status": "OPEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET /api/complaints
Get complaints with role-based filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (OPEN, IN_PROGRESS, RESOLVED)
- `search`: Search in complaint body

**Response:**
```json
{
  "success": true,
  "data": {
    "complaints": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### PUT /api/complaints/:id/status
Update complaint status.

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "comment": "Working on this issue..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint status updated successfully",
  "data": {
    "complaint": {
      "id": "cuid...",
      "status": "IN_PROGRESS",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Redis Key Strategies

### OTP Management
```javascript
// OTP storage (10 minutes)
`otp:${email}` → "123456" (TTL: 600s)

// Failed attempts (24 hours)
`attempts:${email}` → "3" (TTL: 86400s)

// Resend cooldown (60 seconds)
`resend_cooldown:${email}` → "blocked" (TTL: 60s)
```

### Session Management
```javascript
// User session data
`session:${userId}` → {
  role: "STUDENT",
  deptId: "dept-123",
  lastSeen: 1640995200000
} (TTL: 7d)

// Rate limiting
`rate_limit:${ip}:${endpoint}` → [timestamp1, timestamp2, ...]
```

### Cache Strategy
```javascript
// Department cache
`departments:all` → [dept1, dept2, ...] (TTL: 1h)

// User profile cache
`user:${userId}` → {id, email, fullName, role} (TTL: 30m)

// Complaint statistics
`stats:${deptId}:${date}` → {open: 5, inProgress: 3, resolved: 10} (TTL: 1h)
```

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# JWT
JWT_SECRET="minimum-32-character-secret-key"
JWT_EXPIRES_IN="7d"

# SMTP
SMTP_HOST="smtp-relay.brevo.com"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-smtp-key"
EMAIL_FROM="noreply@astu.edu.et"

# Redis
REDIS_HOST="redis"
REDIS_PORT=6379
REDIS_PASSWORD="optional-password"

# External Services
GEMINI_API_KEY="your-gemini-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Frontend
FRONTEND_URL="https://your-domain.com"
```

### Optional Variables
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_NAME=astu_complaints
DATABASE_USER=astu_user
DATABASE_PASSWORD=secure-password
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `ACCOUNT_SUSPENDED`: Account temporarily blocked
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## File Upload Implementation

### Multer Configuration
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

### Cloudinary Upload
```javascript
const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'complaints',
        public_id: filename,
        format: 'auto',
        quality: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};
```

## Testing Strategy

### Unit Tests
```javascript
// Example: OTP Service Test
describe('OTP Service', () => {
  test('should generate 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('should verify valid OTP', async () => {
    await storeOTP('test@astu.edu.et', '123456');
    const result = await verifyOTP('test@astu.edu.et', '123456');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Example: Complaint Creation Test
describe('Complaint API', () => {
  test('POST /api/complaints should create complaint', async () => {
    const response = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        body: 'Test complaint',
        staffDeptId: departmentId
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Database Tests
```javascript
// Example: Database Migration Test
describe('Database Schema', () => {
  test('should create user with valid data', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@astu.edu.et',
        fullName: 'Test User',
        password: 'hashedPassword',
        role: 'STUDENT'
      }
    });
    
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@astu.edu.et');
  });
});
```

## Performance Optimization

### Database Optimization
```sql
-- Add composite indexes for common queries
CREATE INDEX idx_complaints_student_status ON complaints(student_id, status);
CREATE INDEX idx_complaints_dept_status ON complaints(staff_dept_id, status);

-- Partition large tables by date
CREATE TABLE complaints_2024 PARTITION OF complaints
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Caching Strategy
```javascript
// Cache frequently accessed data
const getCachedDepartments = async () => {
  const cacheKey = 'departments:all';
  let departments = await redis.get(cacheKey);
  
  if (!departments) {
    departments = await prisma.staffDepartment.findMany();
    await redis.setEx(cacheKey, 3600, JSON.stringify(departments));
  }
  
  return JSON.parse(departments);
};
```

### Query Optimization
```javascript
// Use select for specific fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    fullName: true,
    role: true
  }
});

// Batch operations
const complaints = await prisma.complaint.findMany({
  where: {
    studentId: { in: studentIds }
  },
  include: {
    student: {
      select: { fullName: true, email: true }
    }
  }
});
```
