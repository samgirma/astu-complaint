# 🎓 ASTU Smart Complaint System

A comprehensive university complaint management system with role-based access control, built with Node.js, Express, PostgreSQL, and React.

## 🏗️ System Architecture

### **User Roles & Permissions**

#### **👨‍🎓 Students**
- **Self-registration** with ASTU email validation (`firstname.lastname@astu.edu.et`)
- **Create complaints** and select target department
- **View own complaint history** and status updates
- **Approve/Decline** resolved complaints
- **Receive notifications** about complaint updates

#### **👨‍💼 Staff**
- **Created by Admin** only (no self-registration)
- **View complaints** assigned to their department only
- **Update status** to "In Progress" or "Resolved"
- **Receive notifications** for new complaints and admin warnings
- **Department-specific access control**

#### **👨‍💼 Admin**
- **Full system access** and oversight
- **Manage departments** (create, update, delete)
- **Create staff accounts** and assign departments
- **View all complaints** and comprehensive analytics
- **Send warnings** to staff departments
- **System health monitoring**

---

## 📊 Database Schema

### **Core Tables**

#### **Users Table**
```sql
- id (UUID, Primary Key)
- email (String, Unique, ASTU format validation)
- password (String, Hashed)
- fullName (String)
- role (Enum: STUDENT, STAFF, ADMIN)
- staffDeptId (UUID, Foreign Key, nullable)
- createdAt/updatedAt (DateTime)
```

#### **Staff Departments Table**
```sql
- id (UUID, Primary Key)
- name (String, Unique)
- description (String, nullable)
- createdAt/updatedAt (DateTime)
```

#### **Complaints Table**
```sql
- id (UUID, Primary Key)
- body (Text, Complaint content)
- studentId (UUID, Foreign Key to Users)
- staffDeptId (UUID, Foreign Key to Staff Departments)
- status (Enum: OPEN, IN_PROGRESS, RESOLVED)
- issueDate (DateTime, default now)
- resolvedAt (DateTime, nullable)
- studentVerified (Boolean, default false)
- resolvedBy (UUID, Foreign Key to Users, nullable)
- createdAt/updatedAt (DateTime)
```

#### **Notifications Table**
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key to Users)
- type (Enum: NEW_COMPLAINT, STATUS_UPDATE, ADMIN_WARNING, APPROVAL_REQUEST)
- title (String)
- message (Text)
- isRead (Boolean, default false)
- createdAt/updatedAt (DateTime)
```

---

## 🔄 Complaint Workflow

### **1. Complaint Creation (Student)**
```
Student submits complaint → Selects department → Status: OPEN
→ Staff in department notified → Student gets confirmation
```

### **2. Complaint Processing (Staff)**
```
Staff views department complaints → Updates to IN_PROGRESS
→ Works on issue → Updates to RESOLVED
→ Student notified for approval
```

### **3. Complaint Resolution (Student)**
```
Student reviews resolved complaint → APPROVE or DECLINE
→ If APPROVED: Status stays RESOLVED
→ If DECLINED: Status reverts to IN_PROGRESS/OPEN
→ Staff notified of decision
```

### **4. Admin Oversight**
```
Admin monitors all complaints → Can send warnings to departments
→ Full analytics access → User management
→ Department management
```

---

## 🚀 API Endpoints

### **Authentication (`/api/auth`)**
- `POST /register` - Student registration (ASTU email validation)
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /change-password` - Change password
- `POST /create-staff` - Create staff user (Admin only)
- `POST /create-admin` - Create admin user (One-time)

### **Complaints (`/api/complaints`)**
- `POST /` - Create complaint (Students only)
- `GET /` - Get complaints (Role-based filtering)
- `GET /stats` - Get complaint statistics
- `GET /departments` - Get all departments
- `GET /:id` - Get single complaint
- `PUT /:id/status` - Update complaint status (Role-based)

### **Admin (`/api/admin`)**
- `POST /departments` - Create department
- `GET /departments` - Get all departments
- `PUT /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department
- `GET /users` - Get all users
- `POST /warn/:staffDeptId` - Send warning to staff department
- `GET /analytics` - Get comprehensive analytics
- `GET /health` - Get system health metrics

### **Notifications (`/api/notifications`)**
- `GET /` - Get user notifications
- `GET /unread-count` - Get unread notification count
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read
- `DELETE /:id` - Delete notification

---

## 🔐 Security Features

### **Authentication & Authorization**
- **JWT-based authentication** with 7-day expiration
- **Role-based access control** (RBAC)
- **ASTU email validation** with regex: `/^[a-zA-Z]+\.[a-zA-Z]+@astu\.edu\.et$/`
- **Password hashing** with bcrypt (12 rounds)
- **Protected routes** with middleware

### **Data Access Control**
- **Students**: Only own complaints
- **Staff**: Only department-assigned complaints
- **Admin**: Full system access
- **Row-level security** implemented in business logic

### **Input Validation**
- **express-validator** for all inputs
- **SQL injection prevention** with Prisma ORM
- **XSS protection** with Helmet middleware
- **Rate limiting** on API endpoints

---

## 📱 Notification System

### **Notification Types**
- **NEW_COMPLAINT**: New complaint assigned to staff
- **STATUS_UPDATE**: Complaint status changed
- **ADMIN_WARNING**: Admin warning to staff
- **APPROVAL_REQUEST**: Student approval/decline action

### **Delivery Methods**
- **Real-time notifications** in dashboard
- **Unread count tracking**
- **Mark as read/delete functionality**
- **Role-based notification filtering**

---

## 📊 Analytics & Reporting

### **Admin Analytics**
- **Overall statistics**: Total complaints, users, departments
- **Complaint breakdown**: By status, department, time period
- **Resolution rates**: Department performance metrics
- **Stagnant complaints**: Open complaints > 7 days
- **User activity**: Registration and engagement metrics

### **Staff Analytics**
- **Department-specific complaints**
- **Personal resolution statistics**
- **Pending items by priority**
- **Response time metrics**

### **Student Analytics**
- **Personal complaint history**
- **Status tracking**
- **Resolution timeline**

---

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose

### **Quick Start**
```bash
# Clone and setup
git clone <repository>
cd astu-complaint-system

# Start database (Docker)
docker compose -f docker-compose.dev.yml up -d postgres

# Setup backend
cd server
npm install
cp .env.example .env
npx prisma db push
node prisma/seed.js
npm run dev

# Setup frontend
cd ../client
npm install
cp .env.example .env
npm run dev
```

### **Environment Variables**
```env
# Backend (.env)
DATABASE_URL=postgresql://astu_user:astu_password@localhost:5432/astu_complaints
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
```

---

## 🧪 Testing

### **API Testing Examples**

#### **Student Registration**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@astu.edu.et",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

#### **Create Complaint**
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "body": "WiFi not working in dormitory building A",
    "staffDeptId": "department-uuid-here"
  }'
```

#### **Admin Warning**
```bash
curl -X POST http://localhost:5000/api/admin/warn/department-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "title": "Urgent: Pending Complaints",
    "message": "Please address the 5 pending complaints in your department"
  }'
```

---

## 🐳 Docker Deployment

### **Development**
```bash
docker compose -f docker-compose.dev.yml up -d
```

### **Production**
```bash
docker compose up -d
```

### **Services**
- **PostgreSQL 18**: Database server
- **Redis 7**: Caching and sessions
- **Backend**: Node.js application
- **Frontend**: React with Nginx
- **Nginx**: Reverse proxy and load balancing

---

## 📁 Project Structure

```
/server
  /controllers          # Business logic
    authController.js
    complaintController.js
    adminController.js
    notificationController.js
  /middleware           # Authentication & validation
    authMiddleware.js
    errorHandler.js
    validation.js
  /routes              # API endpoints
    auth.js
    complaints.js
    admin.js
    notifications.js
  /models              # Prisma schema
    schema.prisma
  /config              # Database configuration
    database.js
  /prisma
    seed.js            # Database seeding
    migrations/        # Database migrations

/client
  /src
    /components        # React components
    /pages            # Page components
    /hooks            # Custom React hooks
    /services         # API service layers
    /utils            # Utility functions
```

---

## 🔄 Business Logic Rules

### **Email Validation**
- Must match pattern: `firstname.lastname@astu.edu.et`
- Case-insensitive matching
- Real-time validation during registration

### **Complaint Status Rules**
- **OPEN** → **IN_PROGRESS** (Staff only)
- **IN_PROGRESS** → **RESOLVED** (Staff only)
- **RESOLVED** → **IN_PROGRESS/OPEN** (Student only)
- **Any status** (Admin only)

### **Department Access**
- Staff can only see complaints from their assigned department
- Students can select any department when creating complaints
- Admin can see all departments and complaints

### **Notification Rules**
- New complaints notify all staff in target department
- Status updates notify the complaint creator
- Admin warnings notify all staff in target department
- Student actions notify the resolving staff member

---

## 🚨 Error Handling

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### **Error Response Format**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors (if applicable)
}
```

---

## 📈 Performance Considerations

### **Database Optimization**
- **Indexes** on frequently queried fields
- **Connection pooling** with Prisma
- **Query optimization** with selective includes
- **Pagination** for large datasets

### **Caching Strategy**
- **Redis** for session storage
- **Application-level caching** for departments
- **API response caching** where appropriate

### **Security Performance**
- **Rate limiting** to prevent abuse
- **Input validation** to prevent attacks
- **SQL injection prevention** with ORM
- **CORS configuration** for cross-origin requests

---

## 🔄 Future Enhancements

### **Planned Features**
- **Email notifications** for complaint updates
- **File attachments** for complaints
- **Advanced analytics** with charts
- **Mobile application** support
- **Integration** with university systems
- **Automated escalation** for stagnant complaints

### **Technical Improvements**
- **Microservices architecture**
- **GraphQL API** for flexible queries
- **WebSocket support** for real-time updates
- **Advanced search** with full-text search
- **Audit logging** for compliance

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Add** tests for new functionality
5. **Submit** a pull request

### **Code Standards**
- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **TypeScript** for type safety (frontend)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

For support and questions:
- **Documentation**: Check this README first
- **Issues**: Create an issue on GitHub
- **Email**: Contact the development team

---

## 🎯 Key Features Summary

✅ **Role-based access control** with 3 user types  
✅ **ASTU email validation** with regex pattern  
✅ **Department-based complaint routing**  
✅ **Complaint workflow** with approval system  
✅ **Real-time notifications**  
✅ **Admin analytics dashboard**  
✅ **Staff warning system**  
✅ **Comprehensive API documentation**  
✅ **Docker containerization**  
✅ **Security best practices**  
✅ **Database seeding** for quick setup  

**🚀 Ready for production deployment!**
