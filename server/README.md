# ASTU Complaint System Backend

A comprehensive backend API for the ASTU Smart Complaint & Issue Tracking System built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Complaint Management**: Full CRUD operations with status workflow
- **AI Chat Integration**: Google Gemini AI for intelligent support
- **Analytics Dashboard**: Comprehensive analytics for all user roles
- **File Uploads**: Cloudinary integration for image uploads
- **Real-time Updates**: Status tracking with comment system
- **Security**: Rate limiting, CORS, helmet, input validation

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Cloudinary account (for image uploads)
- Google Gemini API key (for AI features)

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd astu-complaint-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/astu_complaints"
   JWT_SECRET="your-super-secret-jwt-key"
   GEMINI_API_KEY="your-gemini-api-key"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
   CLOUDINARY_API_KEY="your-cloudinary-api-key"
   CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
server/
├── config/
│   ├── database.js          # Database connection
│   └── cloudinary.js        # Cloudinary configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── complaintController.js # Complaint management
│   ├── analyticsController.js # Analytics endpoints
│   └── chatController.js    # AI chat integration
├── middleware/
│   ├── auth.js              # JWT & role-based auth
│   ├── validation.js        # Input validation
│   └── errorHandler.js      # Error handling
├── models/                  # Prisma models
├── routes/
│   ├── auth.js              # Auth routes
│   ├── complaints.js        # Complaint routes
│   ├── analytics.js         # Analytics routes
│   └── chat.js              # Chat routes
├── utils/                   # Utility functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── uploads/                 # Temporary file uploads
├── server.js                # Main server file
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Complaints
- `POST /api/complaints` - Create complaint (Students only)
- `GET /api/complaints` - Get complaints (filtered by role)
- `GET /api/complaints/:id` - Get single complaint
- `PATCH /api/complaints/:id/status` - Update status (Staff/Admin)
- `POST /api/complaints/:id/comments` - Add comment
- `DELETE /api/complaints/:id` - Delete complaint

### Analytics
- `GET /api/analytics/admin` - Admin dashboard data
- `GET /api/analytics/department` - Department analytics
- `GET /api/analytics/student` - Student statistics
- `GET /api/analytics/export` - Export data (Admin only)

### AI Chat
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/suggestions` - Get AI suggestions
- `GET /api/chat/status` - System status

## 👥 User Roles

### Student
- Create complaints
- View own complaints
- Add comments to own complaints
- Access student analytics

### Department Staff
- View all complaints
- Update complaint status
- Add comments to any complaint
- Access department analytics

### Admin
- Full system access
- Manage all complaints
- Access comprehensive analytics
- Export system data
- User management

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions by user role
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Prevent abuse with rate limiting
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protections
- **Password Hashing**: bcrypt for secure password storage

## 🤖 AI Integration

The system integrates with Google Gemini AI to provide:
- Intelligent chat support
- Complaint suggestions
- Automated responses
- Context-aware assistance

## 📊 Analytics

Comprehensive analytics for:
- Complaint trends and patterns
- Resolution times and rates
- Category breakdowns
- User activity metrics
- Department performance

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

### Database Setup
1. Create PostgreSQL database
2. Run migrations: `npm run db:migrate`
3. Generate Prisma client: `npm run db:generate`

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

Visit `/api` endpoint for complete API documentation when the server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api`

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - Authentication & authorization
  - Complaint management
  - AI chat integration
  - Analytics dashboard
  - File upload support
