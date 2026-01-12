import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startAppointmentReminderJob } from './jobs/appointment-reminders.job.js';
import webSocketService from './services/websocket.service.js';

// Get __dirname equivalent for ES modules
// Type assertion to bypass TypeScript error for import.meta in CommonJS output mode
const getDirname = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaUrl = (import.meta as any).url;
    return path.dirname(fileURLToPath(metaUrl));
  } catch {
    // Fallback for environments where import.meta is not available
    return process.cwd();
  }
};
const __dirname = getDirname();

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import departmentRoutes from './routes/department.routes.js';
import faqRoutes from './routes/faq.routes.js';
import breakdownRoutes from './routes/breakdown.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import downpaymentRoutes from './routes/downpayment.routes.js';
import salesPersonRoutes from './routes/sales-person.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth routes
// More lenient in development, stricter in production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'development' ? 100 : 10, // Allow more attempts in development
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (config.nodeEnv === 'development' && req.ip === '::1') {
      return true;
    }
    return false;
  },
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Nice Car API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Serve admin panel static files (before API routes to avoid conflicts)
const adminDistPath = path.join(__dirname, '../admin/dist');
app.use(express.static(adminDistPath));

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/breakdown', breakdownRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/downpayment', downpaymentRoutes);
app.use('/api/v1/sales-persons', salesPersonRoutes);

// Admin routes - log registration
logger.info('Registering admin routes at /api/v1/admin');
app.use('/api/v1/admin', (req, res, next) => {
  logger.info(`Admin route hit: ${req.method} ${req.originalUrl || req.url}, path: ${req.path}`);
  next();
}, adminRoutes);

// Serve admin panel for non-API routes (React Router fallback)
app.get('*', (req, res, next) => {
  // Don't serve admin panel for API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Serve admin panel index.html for all other routes
  res.sendFile(path.join(adminDistPath, 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize WebSocket server
webSocketService.initialize(httpServer);

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📚 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔌 WebSocket server initialized on /socket.io`);
  
  // Start cron jobs
  startAppointmentReminderJob();
});

export default app;




