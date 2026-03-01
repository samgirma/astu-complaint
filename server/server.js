require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { scheduleWarningChecks } = require('./utils/scheduler');
const { verifyTransporter } = require('./services/mailerService');

// Import routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const staffRoutes = require('./routes/staff');
const staffUsersRoutes = require('./routes/staffUsers');
const warningsRoutes = require('./routes/warnings');
const otpRoutes = require('./routes/otp');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const passwordRoutes = require('./routes/password');

// Create Express app
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      },
    },
  }));
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://astu-complient.firatech.systems',
          'https://astu-frontend.onrender.com',
          "https://astu-complaint-frontend.onrender.com", // Add your Render URL here
          process.env.FRONTEND_URL                // Dynamic fallback
        ]
      : ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/otp', otpRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/staff', staffRoutes);
app.use('/api/admin/staff-users', staffUsersRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/warnings', warningsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/password', passwordRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ASTU Complaint System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new student user',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/change-password': 'Change password',
        'POST /api/auth/create-staff': 'Create staff user (Admin only)',
        'POST /api/auth/create-admin': 'Create admin user (One-time)'
      },
      complaints: {
        'POST /api/complaints': 'Create new complaint (Students only)',
        'GET /api/complaints': 'Get complaints (Role-based access)',
        'GET /api/complaints/stats': 'Get complaint statistics',
        'GET /api/complaints/departments': 'Get all departments',
        'GET /api/complaints/:id': 'Get single complaint',
        'PUT /api/complaints/:id/status': 'Update complaint status (Role-based)'
      },
      admin: {
        'POST /api/admin/departments': 'Create department (Admin only)',
        'GET /api/admin/departments': 'Get all departments (Admin only)',
        'PUT /api/admin/departments/:id': 'Update department (Admin only)',
        'DELETE /api/admin/departments/:id': 'Delete department (Admin only)',
        'GET /api/admin/users': 'Get all users (Admin only)',
        'POST /api/admin/warn/:staffDeptId': 'Send warning to staff department (Admin only)',
        'GET /api/admin/analytics': 'Get comprehensive analytics (Admin only)',
        'GET /api/admin/health': 'Get system health metrics (Admin only)'
      },
      notifications: {
        'GET /api/notifications': 'Get user notifications',
        'GET /api/notifications/unread-count': 'Get unread notification count',
        'PUT /api/notifications/:id/read': 'Mark notification as read',
        'PUT /api/notifications/read-all': 'Mark all notifications as read',
        'DELETE /api/notifications/:id': 'Delete notification'
      }
    }
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 10000;

let isStarting = false;

const startServer = async () => {
  if (isStarting) return; // Stop if already in progress
  isStarting = true;

  try {
    await connectDB();
    
    // Safety check: Use a global variable to prevent double-binding
    if (!global.serverRunning) {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`==> 🚀 ASTU Server is officially live on port ${PORT}`);
        global.serverRunning = true;
      });

      // Handle server errors (like EADDRINUSE) gracefully
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('==> ⚠️ Port already in use, skipping redundant listen call.');
        } else {
          throw err;
        }
      });
    }

    // Background tasks
    verifyTransporter().catch(() => {});
    scheduleWarningChecks();

  } catch (error) {
    console.error("==> ❌ Fatal Startup Error:", error.message);
    isStarting = false;
    // Don't exit immediately; let's first instance stay alive if it exists
  }
};

// MAKE SURE THERE IS NO app.listen() BELOW THIS LINE!
startServer();

// Enhanced error logging for production
process.on('unhandledRejection', (reason, promise) => {
  console.error('==> ❌ UNHANDLED REJECTION:', reason);
  // Optional: keep process alive to inspect logs, or exit after a delay
  setTimeout(() => process.exit(1), 2000); 
});

process.on('uncaughtException', (err) => {
  console.error('==> ❌ UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  setTimeout(() => process.exit(1), 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
